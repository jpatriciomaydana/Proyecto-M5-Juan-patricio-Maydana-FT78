import { useCallback, useMemo, useReducer, useRef } from "react";
import type { JSX, ReactNode } from "react";

import { useAuthContext } from "../hooks/useAuthContext";
import {
    cancelOrder,
    createOrder,
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
} from "../services/orderService";
import type { CartItem } from "../types/cart";
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
const NETWORK_ERROR_MESSAGE =
    "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.";
const PLACE_ORDER_ERROR_MESSAGE =
    "No se pudo completar la compra. Intentá de nuevo.";
const CANCEL_ERROR_MESSAGE =
    "No pudimos cancelar el pedido. Intentá de nuevo en unos minutos.";

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

// Sin conexión, fetch lanza un TypeError. Cualquier otro Error trae un
// mensaje pensado para la persona (por ejemplo, el de "sin stock" que manda
// el servidor).
function getPlaceOrderErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
        return NETWORK_ERROR_MESSAGE;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return PLACE_ORDER_ERROR_MESSAGE;
}

// Cancelar va por la función serverless, así que los errores llegan igual
// que en la compra: TypeError sin red, o un Error con el mensaje del servidor
// (por ejemplo, "Este pedido ya no se puede cancelar").
function getCancelErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
        return NETWORK_ERROR_MESSAGE;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return CANCEL_ERROR_MESSAGE;
}

// Guarda los pedidos y es la única capa que habla con orderService.
// Las pantallas piden cosas por useOrders(). Cómo cambia el estado lo
// decide orderReducer (función pura); acá se llama al servicio, se arman
// los mensajes de error y se hace dispatch.
function OrderProvider({ children }: OrderProviderProps): JSX.Element {
    const { user } = useAuthContext();
    const uid = user?.uid ?? null;

    const [state, dispatch] = useReducer(orderReducer, initialOrderState);

    // Candado contra el doble envío. Un ref cambia al instante; el estado de
    // React recién se actualiza al re-renderizar, y dos clics rápidos podrían
    // colarse en ese intervalo.
    const placingRef = useRef(false);

    // Solo se muestra lo que pertenece al usuario actual.
    const userList = uid !== null && state.user?.uid === uid ? state.user : null;
    const adminList =
        uid !== null && state.admin?.uid === uid ? state.admin : null;
    const selected =
        uid !== null && state.selected?.uid === uid ? state.selected : null;
    const placement =
        uid !== null && state.placement?.uid === uid ? state.placement : null;

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

    const placeOrder = useCallback(
        async (items: CartItem[]): Promise<string | null> => {
            if (!uid || placingRef.current) {
                return null;
            }

            placingRef.current = true;
            dispatch({ type: "PLACE_ORDER_STARTED", uid });

            try {
                const orderId = await createOrder(items);

                dispatch({ type: "PLACE_ORDER_SUCCEEDED", uid });
                return orderId;
            } catch (error) {
                console.error("Error al confirmar la compra:", error);
                dispatch({
                    type: "PLACE_ORDER_FAILED",
                    uid,
                    error: getPlaceOrderErrorMessage(error),
                });
                return null;
            } finally {
                placingRef.current = false;
            }
        },
        [uid],
    );

    const changeStatus = useCallback(
        async (orderId: string, status: OrderStatus): Promise<void> => {
            dispatch({ type: "STATUS_UPDATE_STARTED", orderId });

            const isCancel = status === "cancelled";

            try {
                // Cancelar pasa por la función serverless (repone el stock);
                // las demás transiciones se escriben directo en Firestore.
                if (isCancel) {
                    await cancelOrder(orderId);
                } else {
                    await updateOrderStatus(orderId, status);
                }

                // El servidor ya confirmó: recién ahora cambia el estado en
                // pantalla, en todos los lugares donde esté ese pedido.
                dispatch({ type: "STATUS_UPDATE_SUCCEEDED", orderId, status });
            } catch (error) {
                console.error("No se pudo cambiar el estado:", error);
                dispatch({
                    type: "STATUS_UPDATE_FAILED",
                    error: isCancel
                        ? getCancelErrorMessage(error)
                        : getUpdateErrorMessage(error),
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

    const placingOrder = placement?.placing ?? false;
    const placeOrderError = placement?.error ?? null;

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
            placeOrder,
            placingOrder,
            placeOrderError,
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
            placeOrder,
            placingOrder,
            placeOrderError,
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