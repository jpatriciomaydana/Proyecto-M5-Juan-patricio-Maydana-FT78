import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "../../../components/common/EmptyState";

describe("EmptyState", () => {
    it("muestra el título", () => {
        render(<EmptyState title="Tu carrito está vacío" />);

        expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
    });

    it("muestra la descripción si se pasa", () => {
        render(<EmptyState title="Sin libros" description="Probá otra categoría." />);

        expect(screen.getByText("Probá otra categoría.")).toBeInTheDocument();
    });

    it("no muestra descripción si no se pasa", () => {
        const { container } = render(<EmptyState title="Sin libros" />);

        expect(container.querySelectorAll("p")).toHaveLength(1);
    });

    it("muestra el ícono y la acción si se pasan", () => {
        render(
            <EmptyState
                title="Sin libros"
                icon={<svg data-testid="icono" />}
                action={<a href="/catalogo">Explorar el catálogo</a>}
            />,
        );

        expect(screen.getByTestId("icono")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Explorar el catálogo" }),
        ).toBeInTheDocument();
    });

    it("no muestra ícono ni acción si no se pasan", () => {
        render(<EmptyState title="Sin libros" />);

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});