
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "../../routes/ProtectedRoute";
import AdminRoute from "../../routes/AdminRoute";

const mocks = vi.hoisted(() => ({
    user: null as { uid: string } | null,
    role: null as string | null,
    loading: false,
}));

vi.mock("../../hooks/useAuthContext", () => ({
    useAuthContext: () => ({
        user: mocks.user,
        role: mocks.role,
        loading: mocks.loading,
    }),
}));

function renderRoutes(route: "protected" | "admin") {
    const Guard = route === "protected" ? ProtectedRoute : AdminRoute;

    return render(
        <MemoryRouter initialEntries={["/privado"]}>
            <Routes>
                <Route path="/login" element={<p>Página de login</p>} />
                <Route path="/" element={<p>Página principal</p>} />
                <Route element={<Guard />}>
                    <Route
                        path="/privado"
                        element={<p>Contenido privado</p>}
                    />
                </Route>
            </Routes>
        </MemoryRouter>,
    );
}

describe("Rutas protegidas", () => {
    beforeEach(() => {
        mocks.user = null;
        mocks.role = null;
        mocks.loading = false;
    });

    it("muestra la carga mientras se verifica la sesión", () => {
        mocks.loading = true;

        renderRoutes("protected");

        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("redirige al login si no hay usuario", () => {
        renderRoutes("protected");

        expect(screen.getByText("Página de login")).toBeInTheDocument();
    });

    it("permite acceder si hay un usuario autenticado", () => {
        mocks.user = { uid: "user-1" };

        renderRoutes("protected");

        expect(screen.getByText("Contenido privado")).toBeInTheDocument();
    });

    it("redirige al login si no hay usuario en la ruta admin", () => {
        renderRoutes("admin");

        expect(screen.getByText("Página de login")).toBeInTheDocument();
    });

    it("redirige al inicio si el usuario no es administrador", () => {
        mocks.user = { uid: "user-1" };
        mocks.role = "customer";

        renderRoutes("admin");

        expect(screen.getByText("Página principal")).toBeInTheDocument();
    });

    it("muestra la carga mientras se verifica el acceso admin", () => {
        mocks.loading = true;

        renderRoutes("admin");

        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("permite acceder si el usuario es administrador", () => {
        mocks.user = { uid: "admin-1" };
        mocks.role = "admin";

        renderRoutes("admin");

        expect(screen.getByText("Contenido privado")).toBeInTheDocument();
    });
});
