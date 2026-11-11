
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "../App";

vi.mock("../components/layout/MainLayout", async () => {
    const { Outlet } = await import("react-router-dom");
    return { default: () => <Outlet /> };
});

vi.mock("../components/layout/AdminLayout", async () => {
    const { Outlet } = await import("react-router-dom");
    return { default: () => <Outlet /> };
});

vi.mock("../routes/ProtectedRoute", async () => {
    const { Outlet } = await import("react-router-dom");
    return { default: () => <Outlet /> };
});

vi.mock("../routes/AdminRoute", async () => {
    const { Outlet } = await import("react-router-dom");
    return { default: () => <Outlet /> };
});

vi.mock("../pages/customer/Home", () => ({
    default: () => <h1>Inicio de prueba</h1>,
}));

vi.mock("../pages/customer/Catalog", () => ({
    default: () => <h1>Catálogo de prueba</h1>,
}));

vi.mock("../pages/customer/Orders", () => ({
    default: () => <h1>Mis pedidos de prueba</h1>,
}));

vi.mock("../pages/admin/AdminDashboard", () => ({
    default: () => <h1>Panel de administración de prueba</h1>,
}));

function renderApp(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );
}

describe("App", () => {
    it("muestra la página de inicio", () => {
        renderApp("/");

        expect(
            screen.getByRole("heading", { name: "Inicio de prueba" }),
        ).toBeInTheDocument();
    });

    it("muestra el catálogo", () => {
        renderApp("/catalogo");

        expect(
            screen.getByRole("heading", { name: "Catálogo de prueba" }),
        ).toBeInTheDocument();
    });

    it("muestra los pedidos dentro de la ruta protegida", () => {
        renderApp("/mis-pedidos");

        expect(
            screen.getByRole("heading", { name: "Mis pedidos de prueba" }),
        ).toBeInTheDocument();
    });

    it("muestra el panel de administración", () => {
        renderApp("/admin");

        expect(
            screen.getByRole("heading", {
                name: "Panel de administración de prueba",
            }),
        ).toBeInTheDocument();
    });
});

