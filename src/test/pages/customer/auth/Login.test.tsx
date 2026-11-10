
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "../../../../pages/auth/Login";

const mocks = vi.hoisted(() => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
}));

vi.mock("../../../../hooks/useAuthContext", () => ({
    useAuthContext: () => ({
        login: mocks.login,
        loginWithGoogle: mocks.loginWithGoogle,
    }),
}));

function LocationDisplay() {
    const location = useLocation();
    return <p>Ruta actual: {location.pathname}</p>;
}

function renderLogin(initialEntry: string | object = "/login") {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <LocationDisplay />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<p>Página de registro</p>} />
                <Route path="/carrito" element={<p>Mi carrito</p>} />
                <Route path="/catalogo" element={<p>Catálogo</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.login.mockResolvedValue(undefined);
    mocks.loginWithGoogle.mockResolvedValue(undefined);
});

describe("Login", () => {
    it("muestra el formulario de inicio de sesión", () => {
        renderLogin();

        expect(screen.getByRole("heading", { name: /iniciar sesión/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continuar con google/i })).toBeInTheDocument();
    });

    it("muestra errores al enviar el formulario vacío", () => {
        renderLogin();

        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        expect(screen.getByText(/ingresá tu correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByText(/ingresá tu contraseña/i)).toBeInTheDocument();
        expect(mocks.login).not.toHaveBeenCalled();
    });

    it("valida el formato del correo electrónico", () => {
        renderLogin();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "correo-invalido" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        expect(screen.getByText(/correo válido/i)).toBeInTheDocument();
        expect(mocks.login).not.toHaveBeenCalled();
    });

    it("inicia sesión y redirige al catálogo por defecto", async () => {
        renderLogin();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        await waitFor(() => {
            expect(mocks.login).toHaveBeenCalledWith("ana@correo.com", "secreto1");
            expect(screen.getByText("Ruta actual: /catalogo")).toBeInTheDocument();
        });
    });

    it("elimina espacios del correo antes de iniciar sesión", async () => {
        renderLogin();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: " ana@correo.com " },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        await waitFor(() => {
            expect(mocks.login).toHaveBeenCalledWith("ana@correo.com", "secreto1");
        });
    });

    it("vuelve a la ruta solicitada después de iniciar sesión", async () => {
        renderLogin({
            pathname: "/login",
            state: { returnTo: "/carrito" },
        });

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        await waitFor(() => {
            expect(screen.getByText("Ruta actual: /carrito")).toBeInTheDocument();
        });
    });

    it("muestra un mensaje si las credenciales son incorrectas", async () => {
        mocks.login.mockRejectedValue({ code: "auth/invalid-credential" });

        renderLogin();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "incorrecta" },
        });
        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        expect(await screen.findByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
    });

    it("permite ir al registro conservando el estado de navegación", () => {
        renderLogin({
            pathname: "/login",
            state: { returnTo: "/carrito" },
        });

        fireEvent.click(screen.getByRole("link", { name: /crear cuenta/i }));

        expect(screen.getByText("Página de registro")).toBeInTheDocument();
    });

    it("inicia sesión con Google y redirige al catálogo", async () => {
        renderLogin();

        fireEvent.click(screen.getByRole("button", { name: /continuar con google/i }));

        await waitFor(() => {
            expect(mocks.loginWithGoogle).toHaveBeenCalledTimes(1);
            expect(screen.getByText("Ruta actual: /catalogo")).toBeInTheDocument();
        });
    });

    it("no muestra error si la persona cierra la ventana de Google", async () => {
        mocks.loginWithGoogle.mockRejectedValue({
            code: "auth/popup-closed-by-user",
        });

        renderLogin();

        fireEvent.click(screen.getByRole("button", { name: /continuar con google/i }));

        await waitFor(() => {
            expect(mocks.loginWithGoogle).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByText(/no pudimos ingresar con google/i)).not.toBeInTheDocument();
    });
});
