import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX, ReactNode } from "react";

import { ProductContext } from "./productContextObject";
import type { ProductContextType } from "./productContextObject";
import {
    createProduct,
    deleteProduct,
    subscribeToProducts,
    updateProduct,
} from "../services/productService";
import type { Product, ProductInput } from "../types/product";

interface ProductProviderProps {
    children: ReactNode;
}

// Guarda la lista completa de libros y es la única capa que habla con
// productService. Las pantallas piden cosas por useProducts().
// La lista se mantiene al día sola: Firestore avisa cada cambio
// (onSnapshot), así que agregar, editar o borrar no la actualiza a mano.
function ProductProvider({ children }: ProductProviderProps): JSX.Element {
    const [products, setProducts] = useState<Product[]>([]);
    // Arranca en true para que la pantalla muestre el Spinner y no un
    // "no hay libros" falso mientras llega la primera respuesta.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Guarda la función para dejar de escuchar. Si es null, no estamos escuchando.
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const loadProducts = useCallback((): void => {
        if (unsubscribeRef.current) {
            return;
        }

        unsubscribeRef.current = subscribeToProducts(
            (list) => {
                setProducts(list);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                // Firestore corta la escucha cuando falla: se libera para poder reintentar.
                unsubscribeRef.current = null;
                setError("No pudimos cargar los libros. Intentá de nuevo.");
                setLoading(false);
            }
        );
    }, []);

    // Al desmontarse el Provider se deja de escuchar.
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, []);

    const addProduct = useCallback(
        (input: ProductInput): Promise<string> => createProduct(input),
        [],
    );

    const editProduct = useCallback(
        (id: string, input: ProductInput): Promise<void> =>
            updateProduct(id, input),
        [],
    );

    const removeProduct = useCallback(
        (id: string): Promise<void> => deleteProduct(id),
        [],
    );

    const value = useMemo<ProductContextType>(
        () => ({
            products,
            loading,
            error,
            loadProducts,
            addProduct,
            editProduct,
            removeProduct,
        }),
        [
            products,
            loading,
            error,
            loadProducts,
            addProduct,
            editProduct,
            removeProduct,
        ],
    );

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export { ProductProvider };