export type UserRole = "customer" | "admin";

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: Date;
}

// Usuario autenticado tal como lo ve la app. Propio, sin depender
// del tipo User de Firebase: authService.ts hace la conversión.
export interface AuthUser {
    uid: string;
    email: string | null;
}
