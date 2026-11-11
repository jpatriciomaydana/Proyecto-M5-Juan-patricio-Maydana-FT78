
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import MainLayout from "../../../components/layout/MainLayout";

vi.mock("../../../components/layout/Navbar", () => ({
    default: () => <nav>Barra de navegación</nav>,
}));

vi.mock("../../../components/layout/Footer", () => ({
    default: () => <footer>Pie de página</footer>,
}));

describe("MainLayout", () => {
    it("renderiza Navbar, contenido de la ruta y Footer", () => {
        render(
            <MemoryRouter initialEntries={["/catalogo"]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route
                            path="/catalogo"
                            element={<h1>Catálogo de libros</h1>}
                        />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText("Barra de navegación")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Catálogo de libros" })).toBeInTheDocument();
        expect(screen.getByText("Pie de página")).toBeInTheDocument();
    });

    it("ubica el contenido de la ruta dentro del elemento main", () => {
        render(
            <MemoryRouter initialEntries={["/catalogo"]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route
                            path="/catalogo"
                            element={<p>Contenido principal</p>}
                        />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole("main")).toContainElement(
            screen.getByText("Contenido principal"),
        );
    });
});
