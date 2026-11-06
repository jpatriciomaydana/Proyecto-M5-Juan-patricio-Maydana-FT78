import { createContext } from "react";

import type { Order, OrderStatus } from "../types/order";

export interface OrderContextType {
    // Pedidos de la persona con sesión iniciada (pantalla "Mis pedidos").
    userOrders: Order[];
    userOrdersLoading: boolean;
    userOrdersError: string | null;
    // Pide los pedidos del usuario actual. La llama la pantalla al montarse.
    loadUserOrders: () => void;

    // Todos los pedidos (solo admin: las reglas rechazan a un cliente).
    adminOrders: Order[];
    adminOrdersLoading: boolean;
    adminOrdersError: string | null;
    loadAdminOrders: () => void;

    // Un pedido puntual, para el detalle. Lo puede pedir su dueño o un admin.
    selectedOrder: Order | null;
    selectedOrderLoading: boolean;
    selectedOrderError: string | null;
    loadOrderById: (orderId: string) => void;

    // Cambio de estado (admin). Nunca lanza error: si falla, deja el
    // mensaje en statusUpdateError. Al terminar bien, actualiza las listas.
    changeStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    statusUpdatingId: string | null;
    statusUpdateError: string | null;
}

export const OrderContext = createContext<OrderContextType | undefined>(
    undefined,
);