
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

import Cart from "../../../pages/customer/Cart";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useCart } from "../../../hooks/useCart";
import { useOrders } from "../../../hooks/useOrders";
import type { Product } from "../../../types/product";
import type { CartItem } from "../../../types/cart";

vi.mock("../../../hooks/useAuthContext", () => ({
    useAuthContext: vi.fn(),
}));

vi.mock("../../../hooks/useCart", () => ({
    useCart: vi.fn(),
}));

vi.mock("../../../hooks/useOrders", () => ({
    useOrders: vi.fn(),
}));

const product: Product = {
    id: "book-1",
    title: "Ficciones",
    author: "Jorge Luis Borges",
    description: "Libro de cuentos.",
    price: 12000,
    categoryId: "Clásicos",
    stock: 5,
    imageUrl: "",
    isbn: "9789500712345",
    publisher: "Editorial Losada",
    publicationYear: 1944,
    firstEdition: false,
    createdAt: new Date(),
};

const items: CartItem[] = [{ product, quantity: 2 }];

function LocationProbe() {
    const location = useLocation();

    return (
        <div data-testid="location">
            {JSON.stringify({
                pathname: location.pathname,
                state: location.state,
            })}
        </div>
    );
}

function renderCart() {
    return render(
        <MemoryRouter initialEntries={["/carrito"]}>
            <Cart />
            <LocationProbe />
        </MemoryRouter>,
    );
}

describe("Cart - integración", () => {
    const clearCart = vi.fn();
    const placeOrder = vi.fn();
    const updateQuantity = vi.fn();
    const removeItem = vi.fn();

    function createCartValue(
        overrides: Partial<ReturnType<typeof useCart>> = {},
    ): ReturnType<typeof useCart> {
        return {
            items,
            total: 24000,
            itemCount: 2,
            loading: false,
            getQuantity: vi.fn(),
            addItem: vi.fn(),
            updateQuantity,
            removeItem,
            clearCart,
            ...overrides,
        };
    }

    function createOrdersValue(
        overrides: Partial<ReturnType<typeof useOrders>> = {},
    ): ReturnType<typeof useOrders> {
        return {
            userOrders: [],
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
            placeOrder,
            placingOrder: false,
            placeOrderError: null,
            changeStatus: vi.fn(),
            statusUpdatingId: null,
            statusUpdateError: null,
            ...overrides,
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuthContext).mockReturnValue({
            user: { uid: "user-1" },
        } as ReturnType<typeof useAuthContext>);

        vi.mocked(useCart).mockReturnValue(createCartValue());

        placeOrder.mockResolvedValue("order-123");

        vi.mocked(useOrders).mockReturnValue(createOrdersValue());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("confirma la compra, vacía el carrito y navega al pedido", async () => {
        renderCart();

        expect(
            screen.getByRole("link", { name: "Ficciones" }),
        ).toBeInTheDocument();

        expect(
            screen
                .getByLabelText("Resumen del carrito")
                .querySelector(".cart-summary__total strong"),
        ).toHaveTextContent("$ 24.000,00");

        fireEvent.click(
            screen.getByRole("button", { name: "Confirmar compra" }),
        );

        await waitFor(() => {
            expect(placeOrder).toHaveBeenCalledWith(items);
        });

        expect(clearCart).toHaveBeenCalledOnce();

        await waitFor(() => {
            expect(screen.getByTestId("location")).toHaveTextContent(
                '"pathname":"/mis-pedidos/order-123"',
            );
            expect(screen.getByTestId("location")).toHaveTextContent(
                '"justPurchased":true',
            );
        });
    });

    it("muestra el error y conserva el carrito si falla la compra", async () => {
        placeOrder.mockResolvedValue(null);

        vi.mocked(useOrders).mockReturnValue(
            createOrdersValue({
                placeOrderError: "No se pudo confirmar la compra.",
            }),
        );

        renderCart();

        expect(
            screen.getByRole("alert"),
        ).toHaveTextContent("No se pudo confirmar la compra.");

        fireEvent.click(
            screen.getByRole("button", { name: "Confirmar compra" }),
        );

        await waitFor(() => {
            expect(placeOrder).toHaveBeenCalledWith(items);
        });

        expect(clearCart).not.toHaveBeenCalled();
        expect(screen.getByTestId("location")).toHaveTextContent(
            '"/carrito"',
        );
    });

    it("muestra un mensaje cuando el carrito está vacío", () => {
        vi.mocked(useCart).mockReturnValue(
            createCartValue({
                items: [],
                total: 0,
                itemCount: 0,
            }),
        );

        renderCart();

        expect(
            screen.getByText("Tu carrito está vacío"),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("link", { name: "Explorar el catálogo" }),
        ).toHaveAttribute("href", "/catalogo");
    });

    it("muestra el indicador de carga mientras carga el carrito", () => {
        vi.mocked(useCart).mockReturnValue(
            createCartValue({ loading: true }),
        );

        renderCart();

        expect(screen.getByText("Cargando carrito…")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Confirmar compra" }),
        ).not.toBeInTheDocument();
    });

    it("solicita iniciar sesión si el usuario no está autenticado", () => {
        vi.mocked(useAuthContext).mockReturnValue({
            user: null,
        } as ReturnType<typeof useAuthContext>);

        renderCart();

        expect(
            screen.getByRole("link", {
                name: "Iniciar sesión para comprar",
            }),
        ).toHaveAttribute("href", "/login");
    });

    it("permite aumentar y disminuir la cantidad de un producto", () => {
        renderCart();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Agregar una unidad de Ficciones",
            }),
        );

        expect(updateQuantity).toHaveBeenCalledWith("book-1", 3);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Quitar una unidad de Ficciones",
            }),
        );

        expect(updateQuantity).toHaveBeenCalledWith("book-1", 1);
    });

    it("deshabilita el aumento cuando se alcanza el stock máximo", () => {
        const fullStockItem: CartItem = {
            product: { ...product, stock: 2 },
            quantity: 2,
        };

        vi.mocked(useCart).mockReturnValue(
            createCartValue({
                items: [fullStockItem],
            }),
        );

        renderCart();

        expect(
            screen.getByText("Llegaste al máximo disponible (2)."),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Agregar una unidad de Ficciones",
            }),
        ).toBeDisabled();
    });

    it("permite quitar un producto del carrito", () => {
        renderCart();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Quitar Ficciones del carrito",
            }),
        );

        expect(removeItem).toHaveBeenCalledWith("book-1");
    });

    it("vacía el carrito cuando el usuario confirma la acción", () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        renderCart();

        fireEvent.click(
            screen.getByRole("button", { name: "Vaciar carrito" }),
        );

        expect(window.confirm).toHaveBeenCalledWith(
            "¿Querés vaciar el carrito?",
        );
        expect(clearCart).toHaveBeenCalledOnce();
    });

    it("no vacía el carrito si el usuario cancela la confirmación", () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        renderCart();

        fireEvent.click(
            screen.getByRole("button", { name: "Vaciar carrito" }),
        );

        expect(clearCart).not.toHaveBeenCalled();
    });
});
