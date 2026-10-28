import type { JSX, ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";

interface AppProvidersProps {
    children: ReactNode;
}

// Agrupa todos los providers de contexto de la app en un solo lugar.
// El orden importa: los de afuera están disponibles para los de adentro
// (CartProvider usa la sesión de AuthProvider).
// Cuando haya un contexto nuevo, se agrega acá y main.tsx no cambia.
function AppProviders({ children }: AppProvidersProps): JSX.Element {
    return (
        <AuthProvider>
            <CartProvider>{children}</CartProvider>
        </AuthProvider>
    );
}

export default AppProviders;