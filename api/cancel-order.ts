import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "./_lib/firebaseAdmin.js";
import { OrderError } from "./_lib/orderError.js";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

// Suma las cantidades por libro. Los datos vienen de Firestore, así que se
// validan en lugar de confiar en su forma.
function sumQuantitiesByProduct(raw: unknown): Map<string, number> {
    const quantities = new Map<string, number>();

    if (!Array.isArray(raw)) {
        return quantities;
    }

    for (const entry of raw) {
        if (!isRecord(entry)) {
            continue;
        }

        const { productId, quantity } = entry;

        if (
            typeof productId !== "string" ||
            productId === "" ||
            productId.includes("/")
        ) {
            continue;
        }

        if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
            continue;
        }

        const whole = Math.floor(quantity);

        if (whole <= 0) {
            continue;
        }

        quantities.set(productId, (quantities.get(productId) ?? 0) + whole);
    }

    return quantities;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
): Promise<void> {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        res.status(405).json({ error: "Método no permitido" });
        return;
    }

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Falta el token de sesión" });
        return;
    }

    let uid: string;

    try {
        const decoded = await adminAuth.verifyIdToken(header.slice(7));
        uid = decoded.uid;
    } catch {
        res.status(401).json({ error: "Sesión inválida o vencida" });
        return;
    }

    try {
        // El rol se lee de Firestore desde el servidor: no se confía en nada
        // que mande el navegador.
        const userSnap = await adminDb.collection("users").doc(uid).get();

        if (userSnap.data()?.role !== "admin") {
            res.status(403).json({
                error: "Solo un administrador puede cancelar pedidos",
            });
            return;
        }

        const orderId: unknown = isRecord(req.body)
            ? req.body.orderId
            : undefined;

        if (
            typeof orderId !== "string" ||
            orderId === "" ||
            orderId.includes("/")
        ) {
            res.status(400).json({ error: "Falta el id del pedido" });
            return;
        }

        await adminDb.runTransaction(async (tx) => {
            // --- LECTURAS (todas antes de cualquier escritura) ---
            const orderRef = adminDb.collection("orders").doc(orderId);
            const orderSnap = await tx.get(orderRef);

            if (!orderSnap.exists) {
                throw new OrderError(404, "No encontramos ese pedido");
            }

            const order = orderSnap.data();

            // Un pedido cancelado o completado no se toca: así el stock
            // nunca se repone dos veces.
            if (order?.status !== "pending" && order?.status !== "processing") {
                throw new OrderError(
                    409,
                    "Este pedido ya no se puede cancelar",
                );
            }

            const quantities = sumQuantitiesByProduct(order.items);
            const productRefs = Array.from(quantities.keys()).map((productId) =>
                adminDb.collection("products").doc(productId),
            );
            const productSnaps =
                productRefs.length > 0 ? await tx.getAll(...productRefs) : [];

            // --- ESCRITURAS ---
            productSnaps.forEach((snap) => {
                // Libro borrado después de la compra: no hay stock que reponer.
                if (!snap.exists) {
                    return;
                }

                tx.update(snap.ref, {
                    stock: FieldValue.increment(quantities.get(snap.id) ?? 0),
                });
            });

            tx.update(orderRef, { status: "cancelled" });
        });

        res.status(200).json({ orderId });
    } catch (error) {
        if (error instanceof OrderError) {
            res.status(error.status).json({ error: error.message });
            return;
        }

        console.error("cancel-order falló:", error);
        res.status(500).json({ error: "No se pudo cancelar el pedido" });
    }
}