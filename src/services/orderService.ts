import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

import { auth, db } from "./firebase";
import { saveCartItems } from "./cartService";
import type { CartItem } from "../types/cart";
import type { Order, OrderItem, OrderStatus } from "../types/order";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

// Convierte un documento de Firestore en un Order de la app.
// Igual que toProduct: createdAt llega como Timestamp y se pasa a Date.
function toOrder(id: string, data: DocumentData): Order {
    const createdAt =
        data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(0);

    return {
        id,
        userId: String(data.userId ?? ""),
        items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
        total: Number(data.total ?? 0),
        status: data.status as OrderStatus,
        createdAt,
    };
}

function sortNewestFirst(orders: Order[]): Order[] {
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Trae los pedidos de un cliente. El where("userId", "==", uid) es obligatorio:
// las reglas de Firestore no filtran, rechazan toda consulta que pudiera
// devolver pedidos ajenos. No usamos orderBy para no exigir un índice
// compuesto; se ordena acá, del más nuevo al más viejo.
export async function getUserOrders(uid: string): Promise<Order[]> {
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, where("userId", "==", uid));

    const snapshot = await getDocs(ordersQuery);

    return sortNewestFirst(
        snapshot.docs.map((document) => toOrder(document.id, document.data())),
    );
}

// Trae TODOS los pedidos. Solo funciona con una cuenta admin: la regla de
// orders permite leer cualquier pedido únicamente si isAdmin() es verdadero.
// Con una cuenta de cliente, Firestore rechaza la consulta (permission-denied).
export async function getAllOrders(): Promise<Order[]> {
    const snapshot = await getDocs(collection(db, "orders"));

    return sortNewestFirst(
        snapshot.docs.map((document) => toOrder(document.id, document.data())),
    );
}

// Trae un pedido por su id. Devuelve null si no existe. Si el pedido es de
// otra persona y quien pregunta no es admin, Firestore rechaza la lectura
// (permission-denied): el error llega tal cual a quien llamó.
export async function getOrderById(orderId: string): Promise<Order | null> {
    const snapshot = await getDoc(doc(db, "orders", orderId));

    if (!snapshot.exists()) {
        return null;
    }

    return toOrder(snapshot.id, snapshot.data());
}

// Cambia SOLO el campo status de un pedido. La regla de orders permite esta
// escritura únicamente a un admin y únicamente sobre status. No toca el
// stock de los libros: cancelar un pedido no lo repone (deuda 22).
export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
): Promise<void> {
    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, { status });
}

// Confirma la compra. El navegador NO manda el carrito: manda solo su token
// de sesión y la función serverless lee el carrito desde Firestore.
// Por eso antes se guarda el carrito de la pantalla (si no, el guardado con
// espera podría dejar al servidor con una versión vieja).
export async function createOrder(items: CartItem[]): Promise<string> {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error("Tenés que iniciar sesión para comprar.");
    }

    await saveCartItems(currentUser.uid, items);

    const token = await currentUser.getIdToken();

    let response: Response;

    try {
        response = await fetch("/api/create-order", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        throw new Error(
            "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.",
        );
    }

    // Si la respuesta no es JSON (por ejemplo, una caída de la función),
    // data queda en null y se usa un mensaje genérico.
    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            isRecord(data) && typeof data.error === "string"
                ? data.error
                : "No se pudo completar la compra. Intentá de nuevo.";

        throw new Error(message);
    }

    if (!isRecord(data) || typeof data.orderId !== "string") {
        throw new Error("Respuesta inesperada del servidor.");
    }

    return data.orderId;
}