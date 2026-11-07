import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "./_lib/firebaseAdmin.js";

interface CartLine {
    productId: string;
    quantity: number;
}

interface OrderItemSnapshot {
    productId: string;
    title: string;
    description: string;
    price: number;
    quantity: number;
}

// Error con código HTTP, para cortar la transacción con una respuesta clara.
class OrderError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

// Copia propia de parseCartLines (src/ usa el SDK de cliente y no se comparte).
// Además descarta ids con "/", que no son ids válidos de documento.
function parseCartLines(raw: unknown): CartLine[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    const quantities = new Map<string, number>();

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

    return Array.from(quantities, ([productId, quantity]) => ({
        productId,
        quantity,
    }));
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
        const orderId = await adminDb.runTransaction(async (tx) => {
            // --- LECTURAS (todas antes de cualquier escritura) ---
            const cartRef = adminDb.collection("carts").doc(uid);
            const cartSnap = await tx.get(cartRef);
            const lines = cartSnap.exists
                ? parseCartLines(cartSnap.data()?.items)
                : [];

            if (lines.length === 0) {
                throw new OrderError(400, "El carrito está vacío");
            }

            const productRefs = lines.map((line) =>
                adminDb.collection("products").doc(line.productId),
            );
            const productSnaps = await tx.getAll(...productRefs);

            // --- VALIDACIÓN ---
            const items: OrderItemSnapshot[] = [];
            const newStocks: number[] = [];
            let total = 0;

            lines.forEach((line, index) => {
                const data = productSnaps[index].data();

                if (
                    !data ||
                    typeof data.title !== "string" ||
                    typeof data.price !== "number" ||
                    typeof data.stock !== "number"
                ) {
                    throw new OrderError(
                        409,
                        "Un libro de tu carrito ya no está disponible",
                    );
                }

                if (data.stock < line.quantity) {
                    throw new OrderError(
                        409,
                        `No hay stock suficiente de "${data.title}"`,
                    );
                }

                items.push({
                    productId: line.productId,
                    title: data.title,
                    description:
                        typeof data.description === "string"
                            ? data.description
                            : "",
                    price: data.price,
                    quantity: line.quantity,
                });
                newStocks.push(data.stock - line.quantity);
                total += data.price * line.quantity;
            });

            // --- ESCRITURAS ---
            productRefs.forEach((ref, index) => {
                tx.update(ref, { stock: newStocks[index] });
            });

            const orderRef = adminDb.collection("orders").doc();

            tx.set(orderRef, {
                userId: uid,
                items,
                total: Math.round(total * 100) / 100,
                status: "pending",
                createdAt: FieldValue.serverTimestamp(),
            });

            tx.delete(cartRef);

            return orderRef.id;
        });

        res.status(201).json({ orderId });
    } catch (error) {
        if (error instanceof OrderError) {
            res.status(error.status).json({ error: error.message });
            return;
        }

        console.error("create-order falló:", error);
        res.status(500).json({ error: "No se pudo crear el pedido" });
    }
}