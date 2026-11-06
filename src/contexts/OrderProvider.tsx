import { useCallback, useMemo, useRef, useState } from "react";
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

interface OrderProviderProps {
    children: ReactNode;
}

// Cada lista se guarda junto al uid de quien la pidió. Solo se muestra si
// coincide con el usuario actual: si cambia la sesión, los pedidos del
// usuario anterior dejan de verse sin tener que borrarlos.
interface OrderListState {
    uid: string;
    orders: Order[];
    error: string | null;
}

interface SelectedOrderState {
    uid: string;
    orderId: string;
    loading: boolean;
    order: Order | null;
    error: string | null;
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
// Las pantallas piden cosas por useOrders(). Los mensajes de error se
// arman acá: el servicio deja pasar el error de Firebase tal cual.
function OrderProvider({ children }: OrderProviderProps): JSX.Element {
    const { user } = useAuthContext();
    const uid = user?.uid ?? null;

    const [userState, setUserState] = useState<OrderListState | null>(null);
    const [adminState, setAdminState] = useState<OrderListState | null>(null);
    const [selectedState, setSelectedState] =
        useState<SelectedOrderState | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(
        null,
    );
    const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
        null,
    );

    // Id del último pedido pedido: sirve para ignorar una respuesta tardía
    // si la persona ya pidió otro pedido.
    const latestSelectedIdRef = useRef<string | null>(null);

    const userList = uid !== null && userState?.uid === uid ? userState : null;
    const adminList =
        uid !== null && adminState?.uid === uid ? adminState : null;
    const selected =
        uid !== null && selectedState?.uid === uid ? selectedState : null;

    const loadUserOrders = useCallback((): void => {
        if (!uid) {
            return;
        }

        getUserOrders(uid)
            .then((orders) => {
                setUserState({ uid, orders, error: null });
            })
            .catch((error: unknown) => {
                console.error("No se pudieron cargar los pedidos:", error);
                setUserState({ uid, orders: [], error: LOAD_ERROR_MESSAGE });
            });
    }, [uid]);

    const loadAdminOrders = useCallback((): void => {
        if (!uid) {
            return;
        }

        getAllOrders()
            .then((orders) => {
                setAdminState({ uid, orders, error: null });
            })
            .catch((error: unknown) => {
                console.error("No se pudieron cargar los pedidos:", error);
                setAdminState({ uid, orders: [], error: LOAD_ERROR_MESSAGE });
            });
    }, [uid]);

    const loadOrderById = useCallback(
        (orderId: string): void => {
            if (!uid) {
                return;
            }

            latestSelectedIdRef.current = orderId;
            setSelectedState({
                uid,
                orderId,
                loading: true,
                order: null,
                error: null,
            });

            getOrderById(orderId)
                .then((order) => {
                    if (latestSelectedIdRef.current !== orderId) {
                        return;
                    }

                    setSelectedState({
                        uid,
                        orderId,
                        loading: false,
                        order,
                        error: order ? null : NOT_FOUND_MESSAGE,
                    });
                })
                .catch((error: unknown) => {
                    console.error("No se pudo cargar el pedido:", error);

                    if (latestSelectedIdRef.current !== orderId) {
                        return;
                    }

                    // Un pedido ajeno llega como permission-denied: para la
                    // persona es lo mismo que "no existe".
                    setSelectedState({
                        uid,
                        orderId,
                        loading: false,
                        order: null,
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
            setStatusUpdateError(null);
            setStatusUpdatingId(orderId);

            try {
                await updateOrderStatus(orderId, status);

                // Firestore ya confirmó: recién ahora cambiamos el estado
                // en pantalla, en todos los lugares donde esté ese pedido.
                const applyStatus = (order: Order): Order =>
                    order.id === orderId ? { ...order, status } : order;

                setAdminState((previous) =>
                    previous
                        ? {
                            ...previous,
                            orders: previous.orders.map(applyStatus),
                        }
                        : previous,
                );
                setUserState((previous) =>
                    previous
                        ? {
                            ...previous,
                            orders: previous.orders.map(applyStatus),
                        }
                        : previous,
                );
                setSelectedState((previous) =>
                    previous && previous.order
                        ? { ...previous, order: applyStatus(previous.order) }
                        : previous,
                );
            } catch (error) {
                console.error("No se pudo cambiar el estado:", error);
                setStatusUpdateError(getUpdateErrorMessage(error));
            } finally {
                setStatusUpdatingId(null);
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