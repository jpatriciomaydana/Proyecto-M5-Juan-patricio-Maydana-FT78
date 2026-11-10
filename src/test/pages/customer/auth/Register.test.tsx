
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from "../../../../pages/auth/Register";

const mocks = vi.hoisted(() => ({
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
}));

vi.mock("../../../../hooks/useAuthContext", () => ({
    useAuthContext: () => ({
        register: mocks.register,
        loginWithGoogle: mocks.loginWithGoogle,
    }),
}));

function LocationDisplay() {
    const location = useLocation();
    return <p>Ruta actual: {location.pathname}</p>;
}

function renderRegister(initialEntry: string | object = "/registro") {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <LocationDisplay />
            <Routes>
                <Route path="/registro" element={<Register />} />
                <Route path="/login" element={<p>Página de inicio de sesión</p>} />
                <Route path="/carrito" element={<p>Mi carrito</p>} />
                <Route path="/catalogo" element={<p>Catálogo</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.register.mockResolvedValue(undefined);
    mocks.loginWithGoogle.mockResolvedValue(undefined);
});

describe("Register", () => {
    it("muestra el formulario de registro", () => {
        renderRegister();

        expect(screen.getByRole("heading", { name: /crear cuenta/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continuar con google/i })).toBeInTheDocument();
    });

    it("muestra errores al enviar el formulario vacío", () => {
        renderRegister();

        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        expect(screen.getByText(/ingresá tu correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByText(/ingresá una contraseña/i)).toBeInTheDocument();
        expect(screen.getByText(/repetí la contraseña/i)).toBeInTheDocument();
        expect(mocks.register).not.toHaveBeenCalled();
    });

    it("valida el formato del correo electrónico", () => {
        renderRegister();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "correo-invalido" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        expect(screen.getByText(/correo válido/i)).toBeInTheDocument();
        expect(mocks.register).not.toHaveBeenCalled();
    });

    it("exige una contraseña de al menos seis caracteres", () => {
        renderRegister();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "12345" },
        });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
            target: { value: "12345" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
        expect(mocks.register).not.toHaveBeenCalled();
    });

    it("valida que las contraseñas coincidan", () => {
        renderRegister();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
            target: { value: "distinta1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
        expect(mocks.register).not.toHaveBeenCalled();
    });

    it("registra la cuenta y redirige al catálogo por defecto", async () => {
        renderRegister();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        await waitFor(() => {
            expect(mocks.register).toHaveBeenCalledWith("ana@correo.com", "secreto1");
            expect(screen.getByText("Ruta actual: /catalogo")).toBeInTheDocument();
        });
    });

    it("vuelve a la ruta solicitada después del registro", async () => {
        renderRegister({
            pathname: "/registro",
            state: { returnTo: "/carrito" },
        });

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        await waitFor(() => {
            expect(screen.getByText("Ruta actual: /carrito")).toBeInTheDocument();
        });
    });

    it("muestra un mensaje si el correo ya está registrado", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        mocks.register.mockRejectedValue({ code: "auth/email-already-in-use" });

        renderRegister();

        fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
            target: { value: "ana@correo.com" },
        });
        fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
            target: { value: "secreto1" },
        });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
            target: { value: "secreto1" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));

        expect(await screen.findByText(/ya existe una cuenta con ese correo/i)).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it("permite ir al inicio de sesión", () => {
        renderRegister();

        fireEvent.click(screen.getByRole("link", { name: /iniciar sesión/i }));

        expect(screen.getByText("Página de inicio de sesión")).toBeInTheDocument();
    });

    it("registra mediante Google y redirige al catálogo", async () => {
        renderRegister();

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

        renderRegister();

        fireEvent.click(screen.getByRole("button", { name: /continuar con google/i }));

        await waitFor(() => {
            expect(mocks.loginWithGoogle).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByText(/no pudimos ingresar con google/i)).not.toBeInTheDocument();
    });
});
