
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from "../../../components/layout/Navbar";

const mocks = vi.hoisted(() => ({
    user: null as null | {
        displayName: string | null;
        email: string | null;
        photoURL: string | null;
    },
    profile: null as null | { displayName: string | null },
    role: null as string | null,
    loading: false,
    logout: vi.fn(),
}));

vi.mock("../../../hooks/useAuthContext", () => ({
    useAuthContext: () => ({
        user: mocks.user,
        profile: mocks.profile,
        role: mocks.role,
        loading: mocks.loading,
        logout: mocks.logout,
    }),
}));

vi.mock("../../../components/cart/CartLink", () => ({
    default: ({ onNavigate }: { onNavigate?: () => void }) => (
        <button onClick={onNavigate}>Mock carrito</button>
    ),
}));

vi.mock("../../../components/common/Avatar", () => ({
    default: ({ name }: { name: string }) => (
        <span data-testid="avatar">{name}</span>
    ),
}));

vi.mock("../../../components/layout/SearchBar", () => ({
    default: ({ onSearch }: { onSearch?: () => void }) => (
        <button onClick={onSearch}>Mock búsqueda</button>
    ),
}));

function LocationDisplay() {
    const location = useLocation();
    return <p data-testid="current-path">{location.pathname}</p>;
}

function renderNavbar(initialEntry = "/") {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="*"
                    element={
                        <>
                            <Navbar />
                            <LocationDisplay />
                        </>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe("Navbar", () => {
    beforeEach(() => {
        mocks.user = null;
        mocks.profile = null;
        mocks.role = null;
        mocks.loading = false;
        mocks.logout.mockReset();
    });

    it("muestra los enlaces de ingreso y registro si no hay sesión", () => {
        renderNavbar();

        expect(screen.getByText("Ingresar")).toBeInTheDocument();
        expect(screen.getByText("Registrarse")).toBeInTheDocument();
    });

    it("oculta la cuenta mientras se verifica la sesión", () => {
        mocks.loading = true;
        renderNavbar();

        expect(screen.queryByText("Ingresar")).not.toBeInTheDocument();
        expect(screen.queryByText("Registrarse")).not.toBeInTheDocument();
    });

    it("muestra el saludo y avatar del usuario autenticado", () => {
        mocks.user = {
            displayName: "Juan",
            email: "juan@example.com",
            photoURL: null,
        };

        renderNavbar();

        expect(screen.getByText("Hola, Juan")).toBeInTheDocument();
        expect(screen.getByTestId("avatar")).toHaveTextContent("Juan");
        expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
    });

    it("muestra el enlace de administración solo para administradores", () => {
        mocks.role = "admin";
        renderNavbar();

        expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("abre y cierra el menú desplegable", () => {
        renderNavbar();

        fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

        expect(
            screen.getByRole("button", { name: "Cerrar menú" }),
        ).toHaveAttribute("aria-expanded", "true");

        fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));

        expect(
            screen.getByRole("button", { name: "Abrir menú" }),
        ).toHaveAttribute("aria-expanded", "false");
    });

    it("cierra el menú al navegar al catálogo", () => {
        renderNavbar();

        fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
        fireEvent.click(screen.getByText("Catálogo"));

        expect(screen.getByTestId("current-path")).toHaveTextContent("/catalogo");
        expect(
            screen.getByRole("button", { name: "Abrir menú" }),
        ).toHaveAttribute("aria-expanded", "false");
    });

    it("cierra la sesión y vuelve al inicio", async () => {
        mocks.user = {
            displayName: "Juan",
            email: "juan@example.com",
            photoURL: null,
        };
        mocks.logout.mockResolvedValue(undefined);

        renderNavbar("/catalogo");

        fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

        await waitFor(() => {
            expect(mocks.logout).toHaveBeenCalledOnce();
            expect(screen.getByTestId("current-path")).toHaveTextContent("/");
        });
    });
});
