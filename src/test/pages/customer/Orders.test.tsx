
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Orders from "../../../pages/customer/Orders";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useOrders } from "../../../hooks/useOrders";
import type { OrderContextType } from "../../../contexts/orderContextObject";
import type { Order } from "../../../types/order";

vi.mock("../../../hooks/useAuthContext", () => ({
    useAuthContext: vi.fn(),
}));

vi.mock("../../../hooks/useOrders", () => ({
    useOrders: vi.fn(),
}));

const mockUseAuthContext = vi.mocked(useAuthContext);
const mockUseOrders = vi.mocked(useOrders);

const mockOrders: Order[] = [
    {
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
        ],
        total: 24000,
        status: "pending",
        createdAt: new Date("2026-11-10T12:00:00"),
    },
    {
        id: "order-456",
        userId: "user-123",
        items: [
            {
                productId: "book-2",
                title: "El Aleph",
                description: "Colección de cuentos",
                price: 8000,
                quantity: 1,
            },
        ],
        total: 8000,
        status: "completed",
        createdAt: new Date("2026-11-09T12:00:00"),
    },
];

function createOrdersValue(
    overrides: Partial<OrderContextType> = {},
): OrderContextType {
    return {
        userOrders: mockOrders,
        userOrdersLoading: false,
        userOrdersError: null,
        loadUserOrders: vi.fn(),

        adminOrders: [],
        adminOrdersLoading: false,
        adminOrdersError: null,
        loadAdminOrders: vi.fn(),

        selectedOrder: null,
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

function renderOrders() {
    return render(
        <MemoryRouter>
            <Orders />
        </MemoryRouter>,
    );
}

describe("Orders", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuthContext.mockReturnValue({
            loading: false,
        } as ReturnType<typeof useAuthContext>);

        mockUseOrders.mockReturnValue(createOrdersValue());
    });

    it("solicita el historial al montar la pantalla", () => {
        const loadUserOrders = vi.fn();

        mockUseOrders.mockReturnValue(
            createOrdersValue({ loadUserOrders }),
        );

        renderOrders();

        expect(loadUserOrders).toHaveBeenCalledTimes(1);
    });

    it("muestra el indicador de carga mientras se verifica la autenticación", () => {
        mockUseAuthContext.mockReturnValue({
            loading: true,
        } as ReturnType<typeof useAuthContext>);

        renderOrders();

        expect(
            screen.getByText("Cargando tus pedidos…"),
        ).toBeInTheDocument();
    });

    it("muestra el indicador de carga mientras se obtienen los pedidos", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                userOrdersLoading: true,
            }),
        );

        renderOrders();

        expect(
            screen.getByText("Cargando tus pedidos…"),
        ).toBeInTheDocument();
    });

    it("muestra un mensaje cuando falla la carga del historial", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                userOrdersError: "No se pudieron cargar tus pedidos.",
            }),
        );

        renderOrders();

        expect(
            screen.getByText("No se pudieron cargar tus pedidos."),
        ).toBeInTheDocument();

        expect(
            screen.queryByText("Todavía no hiciste ninguna compra"),
        ).not.toBeInTheDocument();
    });

    it("muestra el estado vacío y el enlace al catálogo cuando no hay pedidos", () => {
        mockUseOrders.mockReturnValue(
            createOrdersValue({
                userOrders: [],
            }),
        );

        renderOrders();

        expect(
            screen.getByText("Todavía no hiciste ninguna compra"),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Cuando compres un libro, vas a ver tu pedido acá.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: "Ver el catálogo" }),
        ).toHaveAttribute("href", "/catalogo");
    });

    it("muestra las tarjetas de los pedidos del usuario", () => {
        renderOrders();

        expect(screen.getByText("Pedido order-123")).toBeInTheDocument();
        expect(screen.getByText("Pedido order-456")).toBeInTheDocument();

        expect(screen.getByText("Pendiente")).toBeInTheDocument();
        expect(screen.getByText("Completado")).toBeInTheDocument();

        expect(screen.getByText("2 libros")).toBeInTheDocument();
        expect(screen.getByText("1 libro")).toBeInTheDocument();
    });

    it("permite acceder al detalle de cada pedido", () => {
        renderOrders();

        const detailLinks = screen.getAllByRole("link", {
            name: "Ver detalle",
        });

        expect(detailLinks).toHaveLength(2);
        expect(detailLinks[0]).toHaveAttribute(
            "href",
            "/mis-pedidos/order-123",
        );
        expect(detailLinks[1]).toHaveAttribute(
            "href",
            "/mis-pedidos/order-456",
        );
    });
});
