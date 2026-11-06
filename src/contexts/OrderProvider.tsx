import { useCallback, useMemo, useReducer } from "react";
import type { JSX, ReactNode } from "react";

import { useAuthContext } from "../hooks/useAuthContext";
import {
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
} from "../services/orderService";
import type { Order, OrderStatus } from "../types/order";
import { OrderContext } from "./orderContextObject";
import type { OrderContextType } from "./orderContextObject";
import { initialOrderState, orderReducer } from "./orderReducer";

interface OrderProviderProps {
    children: ReactNode;
}

const EMPTY_ORDERS: Order[] = [];

const LOAD_ERROR_MESSAGE =
    "No pudimos cargar los pedidos. Intentá de nuevo en unos minutos.";
const NOT_FOUND_MESSAGE = "No encontramos ese pedido.";

function getErrorCode(error: unknown): string {
    return typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
}

function getUpdateErrorMessage(error: unknown): string {
    if (getErrorCode(error) === "permission-denied") {
        return "No tenés permisos para cambiar el estado. Verificá que tu cuenta sea de administrador.";
    }

    return "No pudimos cambiar el estado del pedido. Intentá de nuevo en unos minutos.";
}

// Guarda los pedidos y es la única capa que habla con orderService.
// Las pantallas piden cosas por useOrders(). Cómo cambia el estado lo
// decide orderReducer (función pura); acá se llama al servicio, se arman
// los mensajes de error y se hace dispatch.
function OrderProvider({ children }: OrderProviderProps): JSX.Element {
    const { user } = useAuthContext();
    const uid = user?.uid ?? null;

    const [state, dispatch] = useReducer(orderReducer, initialOrderState);

    // Solo se muestra lo que pertenece al usuario actual.
    const userList = uid !== null && state.user?.uid === uid ? state.user : null;
    const adminList =
        uid !== null && state.admin?.uid === uid ? state.admin : null;
    const selected =
        uid !== null && state.selected?.uid === uid ? state.selected : null;

    const loadUserOrders = useCallback((): void => {
        if (!uid) {
            return;
        }

        getUserOrders(uid)
            .then((orders) => {
                dispatch({ type: "USER_LOADED", uid, orders });
            })
            .catch((error: unknown) => {
                console.error("No se pudieron cargar los pedidos:", error);
                dispatch({ type: "USER_FAILED", uid, error: LOAD_ERROR_MESSAGE });
            });
    }, [uid]);

    const loadAdminOrders = useCallback((): void => {
        if (!uid) {
            return;
        }

        getAllOrders()
            .then((orders) => {
                dispatch({ type: "ADMIN_LOADED", uid, orders });
            })
            .catch((error: unknown) => {
                console.error("No se pudieron cargar los pedidos:", error);
                dispatch({
                    type: "ADMIN_FAILED",
                    uid,
                    error: LOAD_ERROR_MESSAGE,
                });
            });
    }, [uid]);

    const loadOrderById = useCallback(
        (orderId: string): void => {
            if (!uid) {
                return;
            }

            dispatch({ type: "SELECTED_REQUESTED", uid, orderId });

            getOrderById(orderId)
                .then((order) => {
                    if (order) {
                        dispatch({
                            type: "SELECTED_LOADED",
                            uid,
                            orderId,
                            order,
                        });
                    } else {
                        dispatch({
                            type: "SELECTED_FAILED",
                            uid,
                            orderId,
                            error: NOT_FOUND_MESSAGE,
                        });
                    }
                })
                .catch((error: unknown) => {
                    console.error("No se pudo cargar el pedido:", error);

                    // Un pedido ajeno llega como permission-denied: para la
                    // persona es lo mismo que "no existe".
                    dispatch({
                        type: "SELECTED_FAILED",
                        uid,
                        orderId,
                        error:
                            getErrorCode(error) === "permission-denied"
                                ? NOT_FOUND_MESSAGE
                                : LOAD_ERROR_MESSAGE,
                    });
                });
        },
        [uid],
    );

    const changeStatus = useCallback(
        async (orderId: string, status: OrderStatus): Promise<void> => {
            dispatch({ type: "STATUS_UPDATE_STARTED", orderId });

            try {
                await updateOrderStatus(orderId, status);

                // Firestore ya confirmó: recién ahora cambia el estado en
                // pantalla, en todos los lugares donde esté ese pedido.
                dispatch({ type: "STATUS_UPDATE_SUCCEEDED", orderId, status });
            } catch (error) {
                console.error("No se pudo cambiar el estado:", error);
                dispatch({
                    type: "STATUS_UPDATE_FAILED",
                    error: getUpdateErrorMessage(error),
                });
            }
        },
        [],
    );

    const userOrders = userList?.orders ?? EMPTY_ORDERS;
    const userOrdersError = userList?.error ?? null;
    // Mientras hay sesión y todavía no llegó la primera respuesta, está cargando.
    const userOrdersLoading = uid !== null && userList === null;

    const adminOrders = adminList?.orders ?? EMPTY_ORDERS;
    const adminOrdersError = adminList?.error ?? null;
    const adminOrdersLoading = uid !== null && adminList === null;

    const selectedOrder = selected?.order ?? null;
    const selectedOrderError = selected?.error ?? null;
    const selectedOrderLoading =
        uid !== null && (selected === null || selected.loading);

    const { statusUpdatingId, statusUpdateError } = state;

    const value = useMemo<OrderContextType>(
        () => ({
            userOrders,
            userOrdersLoading,
            userOrdersError,
            loadUserOrders,
            adminOrders,
            adminOrdersLoading,
            adminOrdersError,
            loadAdminOrders,
            selectedOrder,
            selectedOrderLoading,
            selectedOrderError,
            loadOrderById,
            changeStatus,
            statusUpdatingId,
            statusUpdateError,
        }),
        [
            userOrders,
            userOrdersLoading,
            userOrdersError,
            loadUserOrders,
            adminOrders,
            adminOrdersLoading,
            adminOrdersError,
            loadAdminOrders,
            selectedOrder,
            selectedOrderLoading,
            selectedOrderError,
            loadOrderById,
            changeStatus,
            statusUpdatingId,
            statusUpdateError,
        ],
    );

    return (
        <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
    );
}

export { OrderProvider };