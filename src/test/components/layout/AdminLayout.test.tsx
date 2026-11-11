
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AdminLayout from "../../../components/layout/AdminLayout";

describe("AdminLayout", () => {
    it("muestra los enlaces de navegación administrativa", () => {
        render(
            <MemoryRouter initialEntries={["/admin"]}>
                <Routes>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<p>Panel principal</p>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText("Administración")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute(
            "href",
            "/admin",
        );
        expect(screen.getByRole("link", { name: "Productos" })).toHaveAttribute(
            "href",
            "/admin/productos",
        );
        expect(screen.getByRole("link", { name: "Pedidos" })).toHaveAttribute(
            "href",
            "/admin/pedidos",
        );
        expect(screen.getByRole("link", { name: "Volver a la tienda" })).toHaveAttribute(
            "href",
            "/",
        );
    });

    it("renderiza la página seleccionada dentro del contenido principal", () => {
        render(
            <MemoryRouter initialEntries={["/admin/productos"]}>
                <Routes>
                    <Route element={<AdminLayout />}>
                        <Route
                            path="/admin/productos"
                            element={<h1>Administrar productos</h1>}
                        />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole("main")).toContainElement(
            screen.getByRole("heading", { name: "Administrar productos" }),
        );
    });
});
