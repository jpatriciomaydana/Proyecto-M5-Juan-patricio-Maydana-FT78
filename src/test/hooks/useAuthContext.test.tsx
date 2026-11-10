import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// El mock va antes de importar el Provider: así no se inicializa Firebase.
vi.mock("../../services/authService", () => ({
    getUserProfile: vi.fn(),
    loginUser: vi.fn(),
    loginWithGoogle: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
    subscribeToAuthChanges: vi.fn(),
}));

import { AuthProvider } from "../../contexts/AuthProvider";
import { useAuthContext } from "../../hooks/useAuthContext";
import {
    getUserProfile,
    loginUser,
    loginWithGoogle,
    logoutUser,
    registerUser,
    subscribeToAuthChanges,
} from "../../services/authService";
import type { AuthUser, UserProfile } from "../../types/user";

type AuthCallback = Parameters<typeof subscribeToAuthChanges>[0];

// Guarda la función que el Provider le da al servicio, para simular
// que Firebase avisa un cambio de sesión.
const captured: { callback: AuthCallback | null } = { callback: null };
const unsubscribe = vi.fn();

const fakeUser = {
    uid: "uid-1",
    email: "ana@correo.com",
    displayName: "Ana",
    photoURL: null,
} as unknown as AuthUser;

const fakeProfile = {
    uid: "uid-1",
    email: "ana@correo.com",
    displayName: "Ana",
    role: "admin",
    createdAt: new Date(0),
} as unknown as UserProfile;

async function emitSession(user: AuthUser | null): Promise<void> {
    await act(async () => {
        await captured.callback?.(user);
    });
}

beforeEach(() => {
    vi.resetAllMocks();
    captured.callback = null;
    vi.mocked(subscribeToAuthChanges).mockImplementation((callback) => {
        captured.callback = callback;
        return unsubscribe;
    });
});

describe("useAuthContext", () => {
    it("tira un error si se usa fuera de AuthProvider", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });

        expect(() => renderHook(() => useAuthContext())).toThrow(
            "useAuthContext debe utilizarse dentro de AuthProvider",
        );

        spy.mockRestore();
    });

    it("arranca cargando y sin usuario", () => {
        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        expect(result.current.loading).toBe(true);
        expect(result.current.user).toBeNull();
        expect(result.current.role).toBeNull();
    });

    it("sin sesión: deja de cargar y no hay perfil", async () => {
        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await emitSession(null);

        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(getUserProfile).not.toHaveBeenCalled();
    });

    it("con sesión: carga el perfil y expone el rol", async () => {
        vi.mocked(getUserProfile).mockResolvedValue(fakeProfile);

        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await emitSession(fakeUser);

        expect(getUserProfile).toHaveBeenCalledWith("uid-1");
        expect(result.current.user).toBe(fakeUser);
        expect(result.current.profile).toBe(fakeProfile);
        expect(result.current.role).toBe("admin");
        expect(result.current.loading).toBe(false);
    });

    it("si falla la carga del perfil: sin perfil, sin rol y deja de cargar", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        vi.mocked(getUserProfile).mockRejectedValue(new Error("sin permiso"));

        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await emitSession(fakeUser);

        expect(result.current.user).toBe(fakeUser);
        expect(result.current.profile).toBeNull();
        expect(result.current.role).toBeNull();
        expect(result.current.loading).toBe(false);

        spy.mockRestore();
    });

    it("login llama al servicio con el correo y la contraseña", async () => {
        vi.mocked(loginUser).mockResolvedValue(undefined as never);

        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await act(async () => {
            await result.current.login("ana@correo.com", "secreto1");
        });

        expect(loginUser).toHaveBeenCalledWith("ana@correo.com", "secreto1");
    });

    it("register crea la cuenta y lee el perfil nuevo", async () => {
        vi.mocked(registerUser).mockResolvedValue("uid-9");
        vi.mocked(getUserProfile).mockResolvedValue(fakeProfile);

        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await act(async () => {
            await result.current.register("ana@correo.com", "secreto1");
        });

        expect(registerUser).toHaveBeenCalledWith("ana@correo.com", "secreto1");
        expect(getUserProfile).toHaveBeenCalledWith("uid-9");
        expect(result.current.profile).toBe(fakeProfile);
    });

    it("loginWithGoogle entra con Google y lee el perfil", async () => {
        vi.mocked(loginWithGoogle).mockResolvedValue("uid-7");
        vi.mocked(getUserProfile).mockResolvedValue(fakeProfile);

        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await act(async () => {
            await result.current.loginWithGoogle();
        });

        expect(loginWithGoogle).toHaveBeenCalledTimes(1);
        expect(getUserProfile).toHaveBeenCalledWith("uid-7");
        expect(result.current.profile).toBe(fakeProfile);
    });

    it("logout llama al servicio", async () => {
        vi.mocked(logoutUser).mockResolvedValue(undefined as never);

        const { result } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(logoutUser).toHaveBeenCalledTimes(1);
    });

    it("deja de escuchar la sesión al desmontarse", () => {
        const { unmount } = renderHook(() => useAuthContext(), {
            wrapper: AuthProvider,
        });

        unmount();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
});