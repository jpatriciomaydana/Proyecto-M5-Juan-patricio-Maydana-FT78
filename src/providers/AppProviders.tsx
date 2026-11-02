import type { JSX, ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthProvider";
import { CartProvider } from "../contexts/CartProvider";
import { ProductProvider } from "../contexts/ProductProvider";

interface AppProvidersProps {
    children: ReactNode;
}

// Agrupa todos los providers de contexto de la app en un solo lugar.
// El orden importa: los de afuera están disponibles para los de adentro
// (CartProvider usa la sesión de AuthProvider; ProductProvider va antes que
// CartProvider por si el carrito necesita leer la lista de libros).
// Cuando haya un contexto nuevo, se agrega acá y main.tsx no cambia.
function AppProviders({ children }: AppProvidersProps): JSX.Element {
    return (
        <AuthProvider>
            <ProductProvider>
                <CartProvider>{children}</CartProvider>
            </ProductProvider>
        </AuthProvider>
    );
}

export default AppProviders;