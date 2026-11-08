import type { OrderStatus } from "../types/order";

// Los valores guardados en Firestore siguen en inglés; esto es solo el texto
// que se ve en pantalla. Lo usan "Mis pedidos" y la vista de administración.
export const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: "Pendiente",
    processing: "En proceso",
    completed: "Completado",
    cancelled: "Cancelado",
};

// Lista ordenada de estados, para armar el filtro del admin.
export const ORDER_STATUSES: OrderStatus[] = [
    "pending",
    "processing",
    "completed",
    "cancelled",
];

// Desde cada estado, a cuáles se puede pasar. Completado y Cancelado son
// finales (lista vacía). Al ser un Record sobre OrderStatus, TypeScript
// obliga a que estén los cuatro estados.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> =
{
    pending: ["processing", "cancelled"],
    processing: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};

// Estados a los que se puede pasar desde el actual (vacío si es final).
export function getNextStatuses(status: OrderStatus): readonly OrderStatus[] {
    return ALLOWED_TRANSITIONS[status];
}

const priceFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
});

export function formatPrice(value: number): string {
    return priceFormatter.format(value);
}

export function formatDate(date: Date): string {
    return date.toLocaleString("es-AR", {
        dateStyle: "long",
        timeStyle: "short",
    });
}