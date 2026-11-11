
import type { PropsWithChildren } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderProvider } from "../../contexts/OrderProvider";
import { useOrders } from "../../hooks/useOrders";
import type { Order } from "../../types/order";

const mocks = vi.hoisted(() => ({
    useAuthContext: vi.fn(),
    getUserOrders: vi.fn(),
    getAllOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    cancelOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
}));

vi.mock("../../hooks/useAuthContext", () => ({
    useAuthContext: mocks.useAuthContext,
}));

vi.mock("../../services/orderService", () => ({
    getUserOrders: mocks.getUserOrders,
    getAllOrders: mocks.getAllOrders,
    getOrderById: mocks.getOrderById,
    createOrder: mocks.createOrder,
    cancelOrder: mocks.cancelOrder,
    updateOrderStatus: mocks.updateOrderStatus,
}));

function Wrapper({ children }: PropsWithChildren) {
    return <OrderProvider>{children}</OrderProvider>;
}

function setup() {
    return renderHook(() => useOrders(), { wrapper: Wrapper });
}

const order = {
    id: "order-1",
    status: "pending",
} as Order;

describe("OrderProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.useAuthContext.mockReturnValue({
            user: { uid: "user-1" },
        });

        mocks.getUserOrders.mockResolvedValue([order]);
        mocks.getAllOrders.mockResolvedValue([order]);
        mocks.getOrderById.mockResolvedValue(order);
        mocks.createOrder.mockResolvedValue("order-new");
        mocks.cancelOrder.mockResolvedValue(undefined);
        mocks.updateOrderStatus.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("carga los pedidos del usuario", async () => {
        const { result } = setup();

        act(() => {
            result.current.loadUserOrders();
        });

        await waitFor(() => {
            expect(result.current.userOrders).toEqual([order]);
            expect(result.current.userOrdersLoading).toBe(false);
        });

        expect(mocks.getUserOrders).toHaveBeenCalledWith("user-1");
    });

    it("muestra un error cuando falla la carga de pedidos", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        mocks.getUserOrders.mockRejectedValue(new Error("Error"));

        const { result } = setup();

        act(() => {
            result.current.loadUserOrders();
        });

        await waitFor(() => {
            expect(result.current.userOrdersError).not.toBeNull();
            expect(result.current.userOrders).toEqual([]);
        });
    });

    it("carga todos los pedidos para el administrador", async () => {
        const { result } = setup();

        act(() => {
            result.current.loadAdminOrders();
        });

        await waitFor(() => {
            expect(result.current.adminOrders).toEqual([order]);
            expect(result.current.adminOrdersLoading).toBe(false);
        });

        expect(mocks.getAllOrders).toHaveBeenCalled();
    });

    it("carga un pedido por su identificador", async () => {
        const { result } = setup();

        act(() => {
            result.current.loadOrderById("order-1");
        });

        await waitFor(() => {
            expect(result.current.selectedOrder).toEqual(order);
            expect(result.current.selectedOrderLoading).toBe(false);
        });

        expect(mocks.getOrderById).toHaveBeenCalledWith("order-1");
    });

    it("informa cuando el pedido solicitado no existe", async () => {
        mocks.getOrderById.mockResolvedValue(null);

        const { result } = setup();

        act(() => {
            result.current.loadOrderById("missing");
        });

        await waitFor(() => {
            expect(result.current.selectedOrder).toBeNull();
            expect(result.current.selectedOrderError).not.toBeNull();
        });
    });

    it("confirma una compra y devuelve el identificador", async () => {
        const { result } = setup();
        let orderId: string | null = null;

        await act(async () => {
            orderId = await result.current.placeOrder([]);
        });

        expect(orderId).toBe("order-new");
        expect(mocks.createOrder).toHaveBeenCalledWith([]);
        expect(result.current.placingOrder).toBe(false);
        expect(result.current.placeOrderError).toBeNull();
    });

    it("guarda el error cuando falla una compra", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        mocks.createOrder.mockRejectedValue(new TypeError("Network error"));

        const { result } = setup();
        let orderId: string | null = "initial";

        await act(async () => {
            orderId = await result.current.placeOrder([]);
        });

        expect(orderId).toBeNull();
        expect(result.current.placingOrder).toBe(false);
        expect(result.current.placeOrderError).not.toBeNull();
    });

    it("actualiza el estado de un pedido", async () => {
        const { result } = setup();

        act(() => {
            result.current.loadUserOrders();
        });

        await waitFor(() => {
            expect(result.current.userOrders).toHaveLength(1);
        });

        await act(async () => {
            await result.current.changeStatus("order-1", "completed");
        });

        expect(mocks.updateOrderStatus).toHaveBeenCalledWith(
            "order-1",
            "completed",
        );
        expect(result.current.userOrders[0].status).toBe("completed");
        expect(result.current.statusUpdatingId).toBeNull();
    });

    it("utiliza la cancelación del servidor para cancelar un pedido", async () => {
        const { result } = setup();

        await act(async () => {
            await result.current.changeStatus("order-1", "cancelled");
        });

        expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1");
        expect(mocks.updateOrderStatus).not.toHaveBeenCalled();
    });

    it("guarda un error cuando falla el cambio de estado", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        mocks.updateOrderStatus.mockRejectedValue(new Error("Error"));

        const { result } = setup();

        await act(async () => {
            await result.current.changeStatus("order-1", "completed");
        });

        expect(result.current.statusUpdatingId).toBeNull();
        expect(result.current.statusUpdateError).not.toBeNull();
    });
});
