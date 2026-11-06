import type { Order, OrderStatus } from "../types/order";

// Cada lista se guarda junto al uid de quien la pidió. Solo se muestra si
// coincide con el usuario actual: si cambia la sesión, los pedidos del
// usuario anterior dejan de verse sin tener que borrarlos.
export interface OrderListState {
    uid: string;
    orders: Order[];
    error: string | null;
}

export interface SelectedOrderState {
    uid: string;
    orderId: string;
    loading: boolean;
    order: Order | null;
    error: string | null;
}

export interface OrderState {
    user: OrderListState | null;
    admin: OrderListState | null;
    selected: SelectedOrderState | null;
    statusUpdatingId: string | null;
    statusUpdateError: string | null;
}

export type OrderAction =
    | { type: "USER_LOADED"; uid: string; orders: Order[] }
    | { type: "USER_FAILED"; uid: string; error: string }
    | { type: "ADMIN_LOADED"; uid: string; orders: Order[] }
    | { type: "ADMIN_FAILED"; uid: string; error: string }
    | { type: "SELECTED_REQUESTED"; uid: string; orderId: string }
    | { type: "SELECTED_LOADED"; uid: string; orderId: string; order: Order }
    | { type: "SELECTED_FAILED"; uid: string; orderId: string; error: string }
    | { type: "STATUS_UPDATE_STARTED"; orderId: string }
    | {
        type: "STATUS_UPDATE_SUCCEEDED";
        orderId: string;
        status: OrderStatus;
    }
    | { type: "STATUS_UPDATE_FAILED"; error: string };

export const initialOrderState: OrderState = {
    user: null,
    admin: null,
    selected: null,
    statusUpdatingId: null,
    statusUpdateError: null,
};

function withStatus(
    orders: Order[],
    orderId: string,
    status: OrderStatus,
): Order[] {
    return orders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
    );
}

// Función pura: dado un estado y una acción, devuelve el estado nuevo.
// No habla con Firebase ni con React, por eso se puede testear sola.
export function orderReducer(
    state: OrderState,
    action: OrderAction,
): OrderState {
    switch (action.type) {
        case "USER_LOADED":
            return {
                ...state,
                user: { uid: action.uid, orders: action.orders, error: null },
            };

        case "USER_FAILED":
            return {
                ...state,
                user: { uid: action.uid, orders: [], error: action.error },
            };

        case "ADMIN_LOADED":
            return {
                ...state,
                admin: { uid: action.uid, orders: action.orders, error: null },
            };

        case "ADMIN_FAILED":
            return {
                ...state,
                admin: { uid: action.uid, orders: [], error: action.error },
            };

        case "SELECTED_REQUESTED":
            return {
                ...state,
                selected: {
                    uid: action.uid,
                    orderId: action.orderId,
                    loading: true,
                    order: null,
                    error: null,
                },
            };

        case "SELECTED_LOADED": {
            const current = state.selected;

            // Respuesta tardía de otro pedido u otra sesión: se ignora.
            if (
                !current ||
                current.uid !== action.uid ||
                current.orderId !== action.orderId
            ) {
                return state;
            }

            return {
                ...state,
                selected: {
                    ...current,
                    loading: false,
                    order: action.order,
                    error: null,
                },
            };
        }

        case "SELECTED_FAILED": {
            const current = state.selected;

            if (
                !current ||
                current.uid !== action.uid ||
                current.orderId !== action.orderId
            ) {
                return state;
            }

            return {
                ...state,
                selected: {
                    ...current,
                    loading: false,
                    order: null,
                    error: action.error,
                },
            };
        }

        case "STATUS_UPDATE_STARTED":
            return {
                ...state,
                statusUpdatingId: action.orderId,
                statusUpdateError: null,
            };

        case "STATUS_UPDATE_SUCCEEDED": {
            const { orderId, status } = action;
            const selected = state.selected;

            return {
                ...state,
                user: state.user
                    ? {
                        ...state.user,
                        orders: withStatus(state.user.orders, orderId, status),
                    }
                    : null,
                admin: state.admin
                    ? {
                        ...state.admin,
                        orders: withStatus(
                            state.admin.orders,
                            orderId,
                            status,
                        ),
                    }
                    : null,
                selected:
                    selected && selected.order && selected.order.id === orderId
                        ? {
                            ...selected,
                            order: { ...selected.order, status },
                        }
                        : selected,
                statusUpdatingId: null,
            };
        }

        case "STATUS_UPDATE_FAILED":
            return {
                ...state,
                statusUpdatingId: null,
                statusUpdateError: action.error,
            };
    }
}