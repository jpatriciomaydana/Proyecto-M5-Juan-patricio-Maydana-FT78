
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppProviders from "../../../providers/AppProviders";

vi.mock("../../../contexts/AuthProvider", () => ({
    AuthProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="auth-provider">{children}</div>
    ),
}));

vi.mock("../../../contexts/ProductProvider", () => ({
    ProductProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="product-provider">{children}</div>
    ),
}));

vi.mock("../../../contexts/CartProvider", () => ({
    CartProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="cart-provider">{children}</div>
    ),
}));

vi.mock("../../../contexts/OrderProvider", () => ({
    OrderProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="order-provider">{children}</div>
    ),
}));

describe("AppProviders", () => {
    it("renderiza los cuatro proveedores y el contenido hijo", () => {
        render(
            <AppProviders>
                <p>Contenido de la aplicación</p>
            </AppProviders>,
        );

        expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
        expect(screen.getByTestId("product-provider")).toBeInTheDocument();
        expect(screen.getByTestId("cart-provider")).toBeInTheDocument();
        expect(screen.getByTestId("order-provider")).toBeInTheDocument();
        expect(screen.getByText("Contenido de la aplicación")).toBeInTheDocument();
    });

    it("respeta el anidamiento de los proveedores", () => {
        render(
            <AppProviders>
                <p>Contenido</p>
            </AppProviders>,
        );

        const auth = screen.getByTestId("auth-provider");
        const product = screen.getByTestId("product-provider");
        const cart = screen.getByTestId("cart-provider");
        const order = screen.getByTestId("order-provider");

        expect(auth).toContainElement(product);
        expect(product).toContainElement(cart);
        expect(cart).toContainElement(order);
    });
});
