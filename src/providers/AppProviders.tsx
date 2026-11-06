import type { JSX, ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthProvider";
import { CartProvider } from "../contexts/CartProvider";
import { OrderProvider } from "../contexts/OrderProvider";
import { ProductProvider } from "../contexts/ProductProvider";

interface AppProvidersProps {
    children: ReactNode;
}



// (CartProvider usa la sesión de AuthProvider; ProductProvider va antes que
// CartProvider por si el carrito necesita leer la lista de libros;
// OrderProvider usa la sesión para mostrar solo los pedidos de quien entró).
function AppProviders({ children }: AppProvidersProps): JSX.Element {
    return (
        <AuthProvider>
            <ProductProvider>
                <CartProvider>
                    <OrderProvider>{children}</OrderProvider>
                </CartProvider>
            </ProductProvider>
        </AuthProvider>
    );
}

export default AppProviders;