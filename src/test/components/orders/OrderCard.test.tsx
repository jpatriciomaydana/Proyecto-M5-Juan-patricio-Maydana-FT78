import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import OrderCard from "../../../components/orders/OrderCard";
import type { Order } from "../../../types/order";

function makeOrder(overrides: Partial<Order> = {}): Order {
    return {
        id: "o1",
        userId: "uid-1",
        items: [
            {
                productId: "p1",
                title: "Drácula",
                description: "Novela de terror",
                price: 1000,
                quantity: 2,
            },
        ],
        total: 2000,
        status: "pending",
        createdAt: new Date(2026, 0, 15, 10, 30),
        ...overrides,
    };
}

function renderCard(order: Order): void {
    render(
        <MemoryRouter>
            <OrderCard order={order} />
        </MemoryRouter>,
    );
}

describe("OrderCard", () => {
    it("muestra el número de pedido", () => {
        renderCard(makeOrder());

        expect(screen.getByText("Pedido o1")).toBeInTheDocument();
    });

    it("muestra el estado en español", () => {
        renderCard(makeOrder({ status: "processing" }));

        expect(screen.getByText("En proceso")).toBeInTheDocument();
    });

    it("marca el estado con su clase", () => {
        renderCard(makeOrder({ status: "cancelled" }));

        expect(screen.getByText("Cancelado")).toHaveClass(
            "order-card__status--cancelled",
        );
    });

    it("suma las cantidades de todos los ítems", () => {
        renderCard(
            makeOrder({
                items: [
                    {
                        productId: "p1",
                        title: "A",
                        description: "",
                        price: 1000,
                        quantity: 2,
                    },
                    {
                        productId: "p2",
                        title: "B",
                        description: "",
                        price: 500,
                        quantity: 1,
                    },
                ],
            }),
        );

        expect(screen.getByText("3 libros")).toBeInTheDocument();
    });

    it("usa el singular con un solo libro", () => {
        renderCard(
            makeOrder({
                items: [
                    {
                        productId: "p1",
                        title: "A",
                        description: "",
                        price: 1000,
                        quantity: 1,
                    },
                ],
            }),
        );

        expect(screen.getByText("1 libro")).toBeInTheDocument();
    });

    it("muestra el total formateado", () => {
        renderCard(makeOrder({ total: 12500 }));

        expect(screen.getByText(/12\.500,00/)).toBeInTheDocument();
    });

    it("enlaza al detalle del pedido", () => {
        renderCard(makeOrder());

        expect(
            screen.getByRole("link", { name: "Ver detalle" }),
        ).toHaveAttribute("href", "/mis-pedidos/o1");
    });
});