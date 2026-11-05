import { useEffect, useState } from "react";
import type { JSX, ReactNode } from "react";

import {
    getUserProfile,
    loginUser,
    loginWithGoogle as signInWithGoogle,
    logoutUser,
    registerUser,
    subscribeToAuthChanges,
} from "../services/authService";
import type { AuthUser, UserProfile } from "../types/user";
import { AuthContext } from "./authContextObject";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
            setUser(currentUser);

            if (!currentUser) {
                setProfile(null);
                setLoading(false);
                return;
            }

            try {
                const userProfile = await getUserProfile(currentUser.uid);
                setProfile(userProfile);
                //console.log("Perfil cargado:", userProfile);
            } catch (error) {
                console.error("Error al cargar el perfil:", error);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    async function login(email: string, password: string): Promise<void> {
        await loginUser(email, password);
    }

    async function loginWithGoogle(): Promise<void> {
        const uid = await signInWithGoogle();

        // Si era su primera vez, el perfil se creó recién: lo volvemos a
        // leer porque el listener de sesión pudo ejecutarse antes.
        setProfile(await getUserProfile(uid));
    }

    async function register(
        email: string,
        password: string,
    ): Promise<void> {
        const uid = await registerUser(email, password);

        // El perfil recién se guardó: volvemos a leerlo porque
        // el listener de sesión pudo ejecutarse antes de que existiera.
        setProfile(await getUserProfile(uid));
    }

    async function logout(): Promise<void> {
        await logoutUser();
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                role: profile?.role ?? null,
                loading,
                login,
                loginWithGoogle,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}