
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { CartProvider } from "../../contexts/CartProvider";
import { CartContext } from "../../contexts/cartContextObject";
import type { CartItem } from "../../types/cart";
import type { Product } from "../../types/product";

const mocks = vi.hoisted(() => ({
    auth: {
        user: null as { uid: string } | null,
        loading: false,
    },
    clearCartItems: vi.fn(),
    getCartItems: vi.fn(),
    parseCartLines: vi.fn(),
    resolveCartLines: vi.fn(),
    saveCartItems: vi.fn(),
    toCartLines: vi.fn(),
}));

vi.mock("../../hooks/useAuthContext", () => ({
    useAuthContext: () => ({
        user: mocks.auth.user,
        loading: mocks.auth.loading,
    }),
}));

vi.mock("../../services/cartService", () => ({
    clearCartItems: mocks.clearCartItems,
    getCartItems: mocks.getCartItems,
    parseCartLines: mocks.parseCartLines,
    resolveCartLines: mocks.resolveCartLines,
    saveCartItems: mocks.saveCartItems,
    toCartLines: mocks.toCartLines,
}));

const product: Product = {
    id: "book-1",
    title: "Ficciones",
    author: "Jorge Luis Borges",
    description: "Libro de cuentos",
    price: 15000,
    categoryId: "Clásicos",
    stock: 5,
    imageUrl: "",
    isbn: "9788420633125",
    publisher: "Alianza",
    publicationYear: 1944,
    firstEdition: false,
    createdAt: new Date(),
};

const item: CartItem = {
    product,
    quantity: 2,
};

function setup() {
    const wrapper = ({ children }: PropsWithChildren) => (
        <CartProvider>{children}</CartProvider>
    );

    return renderHook(() => {
        const context = React.useContext(CartContext);

        if (!context) {
            throw new Error("CartProvider no encontrado");
        }

        return context;
    }, { wrapper });
}

describe("CartProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        mocks.auth.user = null;
        mocks.auth.loading = false;

        mocks.parseCartLines.mockImplementation((lines) => lines);
        mocks.resolveCartLines.mockResolvedValue([]);
        mocks.getCartItems.mockResolvedValue([]);
        mocks.saveCartItems.mockResolvedValue(undefined);
        mocks.clearCartItems.mockResolvedValue(undefined);
        mocks.toCartLines.mockImplementation((items: CartItem[]) =>
            items.map((entry) => ({
                productId: entry.product.id,
                quantity: entry.quantity,
            })),
        );
    });

    it("carga el carrito del invitado desde localStorage", async () => {
        localStorage.setItem(
            "libreria-cart-guest",
            JSON.stringify([{ productId: "book-1", quantity: 2 }]),
        );
        mocks.resolveCartLines.mockResolvedValue([item]);

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.items).toEqual([item]);
        expect(result.current.total).toBe(30000);
        expect(result.current.itemCount).toBe(2);
        expect(result.current.getQuantity("book-1")).toBe(2);
    });

    it("carga el carrito de una cuenta", async () => {
        mocks.auth.user = { uid: "user-1" };
        mocks.getCartItems.mockResolvedValue([item]);

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mocks.getCartItems).toHaveBeenCalledWith("user-1");
        expect(result.current.items).toEqual([item]);
    });

    it("fusiona el carrito del invitado con el de la cuenta", async () => {
        mocks.auth.user = { uid: "user-1" };

        localStorage.setItem(
            "libreria-cart-guest",
            JSON.stringify([{ productId: "book-1", quantity: 2 }]),
        );

        mocks.getCartItems.mockResolvedValue([{ ...item, quantity: 2 }]);
        mocks.resolveCartLines.mockResolvedValue([{ ...item, quantity: 2 }]);

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.items[0].quantity).toBe(4);
        expect(mocks.saveCartItems).toHaveBeenCalledWith(
            "user-1",
            expect.arrayContaining([
                expect.objectContaining({ quantity: 4 }),
            ]),
        );
        expect(localStorage.getItem("libreria-cart-guest")).toBeNull();
    });

    it("agrega un producto y calcula los totales", async () => {
        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.addItem(product);
        });

        expect(result.current.items).toEqual([{ product, quantity: 1 }]);
        expect(result.current.total).toBe(15000);
        expect(result.current.itemCount).toBe(1);
    });

    it("actualiza la cantidad de un producto", async () => {
        mocks.resolveCartLines.mockResolvedValue([item]);

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.updateQuantity("book-1", 4);
        });

        expect(result.current.getQuantity("book-1")).toBe(4);
        expect(result.current.total).toBe(60000);
    });

    it("elimina un producto del carrito", async () => {
        mocks.resolveCartLines.mockResolvedValue([item]);

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.removeItem("book-1");
        });

        expect(result.current.items).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(result.current.itemCount).toBe(0);
    });

    it("vacía el carrito", async () => {
        mocks.resolveCartLines.mockResolvedValue([item]);

        const { result } = setup();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.clearCart();
        });

        expect(result.current.items).toEqual([]);
    });

    it("no permite modificar el carrito mientras está cargando", async () => {
        mocks.auth.loading = true;

        const { result } = setup();

        act(() => {
            result.current.addItem(product);
            result.current.updateQuantity("book-1", 3);
            result.current.removeItem("book-1");
            result.current.clearCart();
        });

        expect(result.current.loading).toBe(true);
        expect(result.current.items).toEqual([]);
    });
});
