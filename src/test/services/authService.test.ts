
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";

const mocks = vi.hoisted(() => ({
    createUserWithEmailAndPassword: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    setDoc: vi.fn(),
    auth: {},
    db: {},
}));

vi.mock("firebase/auth", () => ({
    createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
    GoogleAuthProvider: vi.fn(),
    onAuthStateChanged: mocks.onAuthStateChanged,
    signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
    signInWithPopup: mocks.signInWithPopup,
    signOut: mocks.signOut,
}));

vi.mock("firebase/firestore", () => ({
    doc: mocks.doc,
    getDoc: mocks.getDoc,
    serverTimestamp: mocks.serverTimestamp,
    setDoc: mocks.setDoc,
    Timestamp: class Timestamp {
        constructor(date: Date) {
            this.date = date;
        }

        private date: Date;
        toDate() {
            return this.date;
        }
    },
}));

vi.mock("../../services/firebase", () => ({
    auth: mocks.auth,
    db: mocks.db,
}));

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import {
    getUserProfile,
    loginUser,
    loginWithGoogle,
    logoutUser,
    registerUser,
    subscribeToAuthChanges,
} from "../../services/authService";

const unsubscribe = vi.fn();
const userCredential = {
    user: {
        uid: "uid-1",
        email: "ana@correo.com",
        displayName: "Ana",
        photoURL: null,
    },
};

beforeEach(() => {
    vi.resetAllMocks();

    mocks.doc.mockReturnValue("users/uid-1");
    mocks.serverTimestamp.mockReturnValue("server-timestamp");
});

const MockTimestamp = Timestamp as unknown as new (
    date: Date,
) => Timestamp;

describe("authService", () => {
    it("escucha los cambios de sesión y transforma el usuario", () => {
        const callback = vi.fn();

        vi.mocked(onAuthStateChanged).mockImplementation(
            (_auth, observer) => {
                (observer as (user: unknown) => void)(userCredential.user);
                return unsubscribe;
            },
        );

        const result = subscribeToAuthChanges(callback);

        expect(callback).toHaveBeenCalledWith({
            uid: "uid-1",
            email: "ana@correo.com",
            displayName: "Ana",
            photoURL: null,
        });
        expect(result).toBe(unsubscribe);
    });

    it("informa cuando no hay una sesión activa", () => {
        const callback = vi.fn();

        vi.mocked(onAuthStateChanged).mockImplementation(
            (_auth, observer) => {
                (observer as (user: unknown) => void)(null);
                return unsubscribe;
            },
        );

        subscribeToAuthChanges(callback);

        expect(callback).toHaveBeenCalledWith(null);
    });

    it("registra un usuario y crea su perfil como customer", async () => {
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(
            userCredential as never,
        );

        const result = await registerUser("ana@correo.com", "secreto1");

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "ana@correo.com",
            "secreto1",
        );
        expect(doc).toHaveBeenCalledWith(mocks.db, "users", "uid-1");
        expect(setDoc).toHaveBeenCalledWith("users/uid-1", {
            email: "ana@correo.com",
            role: "customer",
            createdAt: "server-timestamp",
        });
        expect(serverTimestamp).toHaveBeenCalled();
        expect(result).toBe("uid-1");
    });

    it("inicia sesión con correo y contraseña", async () => {
        vi.mocked(signInWithEmailAndPassword).mockResolvedValue(
            userCredential as never,
        );

        await loginUser("ana@correo.com", "secreto1");

        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            mocks.auth,
            "ana@correo.com",
            "secreto1",
        );
    });

    it("crea el perfil customer al ingresar por Google por primera vez", async () => {
        vi.mocked(signInWithPopup).mockResolvedValue(userCredential as never);
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => false,
        } as never);

        const result = await loginWithGoogle();

        expect(signInWithPopup).toHaveBeenCalled();
        expect(getDoc).toHaveBeenCalled();
        expect(setDoc).toHaveBeenCalledWith("users/uid-1", {
            email: "ana@correo.com",
            role: "customer",
            createdAt: "server-timestamp",
        });
        expect(result).toBe("uid-1");
    });

    it("no modifica el perfil existente al ingresar por Google", async () => {
        vi.mocked(signInWithPopup).mockResolvedValue(userCredential as never);
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            id: "uid-1",
            data: () => ({ role: "admin" }),
        } as never);

        const result = await loginWithGoogle();

        expect(setDoc).not.toHaveBeenCalled();
        expect(result).toBe("uid-1");
    });

    it("cierra la sesión", async () => {
        vi.mocked(signOut).mockResolvedValue(undefined);

        await logoutUser();

        expect(signOut).toHaveBeenCalledWith(mocks.auth);
    });

    it("devuelve null cuando no existe el perfil", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => false,
        } as never);

        const result = await getUserProfile("uid-1");

        expect(doc).toHaveBeenCalledWith(mocks.db, "users", "uid-1");
        expect(result).toBeNull();
    });

    it("recupera el perfil y convierte Timestamp a Date", async () => {
        const date = new Date("2025-01-15T00:00:00Z");

        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            id: "uid-1",
            data: () => ({
                email: "ana@correo.com",
                displayName: "Ana",
                role: "admin",
                createdAt: new MockTimestamp(date),
            }),
        } as never);

        const result = await getUserProfile("uid-1");

        expect(result).toEqual({
            uid: "uid-1",
            email: "ana@correo.com",
            displayName: "Ana",
            role: "admin",
            createdAt: date,
        });
    });

    it("usa valores por defecto si faltan datos del perfil", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            id: "uid-2",
            data: () => ({
                email: "usuario@correo.com",
                role: "otro-rol",
            }),
        } as never);

        const result = await getUserProfile("uid-2");

        expect(result?.displayName).toBe("");
        expect(result?.role).toBe("customer");
        expect(result?.createdAt).toBeInstanceOf(Date);
    });
});
