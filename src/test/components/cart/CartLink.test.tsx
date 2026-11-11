
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import CartLink from "../../../components/cart/CartLink";

const mocks = vi.hoisted(() => ({
    itemCount: 0,
}));

vi.mock("../../../hooks/useCart", () => ({
    useCart: () => ({
        itemCount: mocks.itemCount,
    }),
}));

function renderCartLink(onNavigate = vi.fn()) {
    render(
        <MemoryRouter>
            <CartLink onNavigate={onNavigate} />
        </MemoryRouter>,
    );

    return onNavigate;
}

describe("CartLink", () => {
    it("muestra el carrito sin contador cuando está vacío", () => {
        mocks.itemCount = 0;
        renderCartLink();

        expect(screen.getByRole("link", { name: "Carrito" })).toBeInTheDocument();
        expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("muestra un producto en el contador", () => {
        mocks.itemCount = 1;
        renderCartLink();

        expect(
            screen.getByRole("link", { name: "Carrito, 1 producto" }),
        ).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("muestra varios productos en el contador", () => {
        mocks.itemCount = 5;
        renderCartLink();

        expect(
            screen.getByRole("link", { name: "Carrito, 5 productos" }),
        ).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("limita el contador a 99+", () => {
        mocks.itemCount = 120;
        renderCartLink();

        expect(screen.getByText("99+")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Carrito, 120 productos" }),
        ).toBeInTheDocument();
    });

    it("ejecuta onNavigate al hacer clic", () => {
        mocks.itemCount = 2;
        const onNavigate = renderCartLink();

        fireEvent.click(screen.getByRole("link"));

        expect(onNavigate).toHaveBeenCalledOnce();
    });
});
