
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Home from "../../../pages/customer/Home";

describe("Home", () => {
    it("muestra el título principal de bienvenida", () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("heading", {
                name: /historias quemerecen ser descubiertas\./i,
            }),
        ).toBeInTheDocument();
    });

    it("permite navegar al catálogo", () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>,
        );

        const links = screen.getAllByRole("link", {
            name: /explorar catálogo|descubrir libros/i,
        });

        expect(links).toHaveLength(2);
        links.forEach((link) => {
            expect(link).toHaveAttribute("href", "/catalogo");
        });
    });

    it("muestra la sección sobre la librería", () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("link", { name: /nuestra librería/i }),
        ).toHaveAttribute("href", "#sobre-nosotros");

        expect(
            document.getElementById("sobre-nosotros"),
        ).toBeInTheDocument();
    });
});
