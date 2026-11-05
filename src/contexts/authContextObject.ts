import { createContext } from "react";

import type { AuthUser, UserProfile, UserRole } from "../types/user";

export interface AuthContextType {
    user: AuthUser | null;
    profile: UserProfile | null;
    role: UserRole | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);