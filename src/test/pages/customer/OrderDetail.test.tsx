
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import OrderDetail from "../../../pages/customer/OrderDetail";
import { useOrders } from "../../../hooks/useOrders";
import type { OrderContextType } from "../../../contexts/orderContextObject";
import type { Order } from "../../../types/order";

vi.mock("../../../hooks/useOrders", () => ({
    useOrders: vi.fn(),
}));

const mockUseOrders = vi.mocked(useOrders);

const mockOrder: Order = {
    id: "order-123",
    userId: "user-123",
    items: [
        {
            productId: "book-1",
            title: "Ficciones",
            description: "Libro de cuentos de Jorge Luis Borges",
            price: 12000,
            quantity: 2,
        },
        {
            productId: "book-2",
            title: "El Aleph",
            description: "Colección de cuentos",
            price: 8000,
            quantity: 1,
        },
    ],
    total: 32000,
    status: "pending",
    createdAt: new Date("2026-11-10T12:00:00"),
};

function createOrdersValue(
    overrides: Partial<OrderContextType> = {},
): OrderContextType {
    return {
        userOrders: [],
        userOrdersLoading: false,
        userOrdersError: null,
        loadUserOrders: vi.fn(),

        adminOrders: [],
        adminOrdersLoading: false,
        adminOrdersError: null,
        loadAdminOrders: vi.fn(),

        selectedOrder: mockOrder,
        selectedOrderLoading: false,
        selectedOrderError: null,
        loadOrderById: vi.fn(),

        placeOrder: vi.fn(),
        placingOrder: false,
        placeOrderError: null,

        changeStatus: vi.fn(),
        statusUpdatingId: null,
        statusUpdateError: null,

        ...overrides,
    };
}

function LocationProbe() {
    const location = useLocation();

    return (
        <output data-testid="current-location">
            {location.pathname}
        </output>
    );
}

function renderOrderDetail(
    state?: { justPurchased?: boolean },
) {
    return render(
        <MemoryRouter
            initialEntries={[
                {
                    pathname: "/mis-pedidos/order-123",
                    state,
                },
            ]}
        >
            <Routes>
                <Route
                    path="/mis-pedidos/:orderId"
                    element={<OrderDetail />}
                />
            </Routes>
            <LocationProbe />
        </MemoryRouter>,
    );
}

describe("OrderDetail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOrders.mockReturnValue(createOrdersValue());
    });

    it("muestra el indicador de carga", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                selectedOrderLoading: true,
            }),
        );

        renderOrderDetail();

        expect(
            screen.getByText("Cargando pedido…"),
        ).toBeInTheDocument();
    });

    it("solicita el pedido usando el identificador de la URL", () => {
        const loadOrderById = vi.fn();

        mockUseOrders.mockReturnValue(
            createOrdersValue({ loadOrderById }),
        );

        renderOrderDetail();

        expect(loadOrderById).toHaveBeenCalledWith("order-123");
        expect(loadOrderById).toHaveBeenCalledTimes(1);
    });

    it("muestra el error cuando falla la búsqueda", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                selectedOrderError: "No se pudo cargar el pedido.",
            }),
        );

        renderOrderDetail();

        expect(
            screen.getByText("No se pudo cargar el pedido."),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: "Ir a mis pedidos" }),
        ).toHaveAttribute("href", "/mis-pedidos");
    });

    it("muestra un mensaje cuando el pedido no existe", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                selectedOrder: null,
            }),
        );

        renderOrderDetail();

        expect(
            screen.getByText("No encontramos ese pedido."),
        ).toBeInTheDocument();
    });

    it("no muestra un pedido cuyo identificador no coincide con la URL", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                selectedOrder: {
                    ...mockOrder,
                    id: "otro-pedido",
                },
            }),
        );

        renderOrderDetail();

        expect(
            screen.getByText("No encontramos ese pedido."),
        ).toBeInTheDocument();

        expect(
            screen.queryByText("Comprobante de pedido"),
        ).not.toBeInTheDocument();
    });

    it("muestra los datos principales del comprobante", () => {
        renderOrderDetail();

        expect(
            screen.getByRole("heading", {
                name: "Comprobante de pedido",
            }),
        ).toBeInTheDocument();

        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.getByText("El Aleph")).toBeInTheDocument();
        expect(screen.getByText("order-123")).toBeInTheDocument();
        expect(screen.getByText("Pendiente")).toBeInTheDocument();
    });

    it("muestra el mensaje de compra realizada cuando llega desde el carrito", () => {
        renderOrderDetail({ justPurchased: true });

        expect(
            screen.getByText("¡Compra realizada!"),
        ).toBeInTheDocument();

        expect(
            screen.getByText("Registramos tu pedido."),
        ).toBeInTheDocument();
    });

    it("no muestra el mensaje de compra realizada al entrar desde Mis pedidos", () => {
        renderOrderDetail();

        expect(
            screen.queryByText("¡Compra realizada!"),
        ).not.toBeInTheDocument();
    });

    it("calcula la cantidad de libros y muestra los subtotales y el total", () => {
        renderOrderDetail();

        expect(
            screen.getByText("Total (3 libros)"),
        ).toBeInTheDocument();

        expect(screen.getByText("$ 24.000,00")).toBeInTheDocument();
        expect(screen.getByText(/1\s*×\s*\$ 8\.000,00/)).toBeInTheDocument();
        expect(screen.getByText("$ 32.000,00")).toBeInTheDocument();
    });

    it("muestra el enlace para volver a Mis pedidos", () => {
        renderOrderDetail();

        expect(
            screen.getByRole("link", {
                name: /Volver a mis pedidos/,
            }),
        ).toHaveAttribute("href", "/mis-pedidos");
    });

    it("muestra el estado cancelado con su etiqueta correspondiente", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                selectedOrder: {
                    ...mockOrder,
                    status: "cancelled",
                },
            }),
        );

        renderOrderDetail();

        expect(screen.getByText("Cancelado")).toBeInTheDocument();
    });

    it("muestra la cantidad en singular cuando el pedido tiene un solo libro", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                selectedOrder: {
                    ...mockOrder,
                    items: [
                        {
                            productId: "book-1",
                            title: "Ficciones",
                            description: "Libro de cuentos",
                            price: 12000,
                            quantity: 1,
                        },
                    ],
                    total: 12000,
                },
            }),
        );

        renderOrderDetail();

        expect(
            screen.getByText("Total (1 libro)"),
        ).toBeInTheDocument();
    });
});
