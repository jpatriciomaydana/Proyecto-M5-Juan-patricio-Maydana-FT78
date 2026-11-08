import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX, ReactNode } from "react";

import { ProductContext } from "./productContextObject";
import type { ProductContextType } from "./productContextObject";
import { uploadProductImage } from "../services/imageService";
import {
    createProduct,
    deleteProduct,
    getProductById,
    subscribeToProducts,
    updateProduct,
} from "../services/productService";
import type { Product, ProductInput } from "../types/product";

interface ProductProviderProps {
    children: ReactNode;
}

// Resultado de pedir un libro puntual. Guarda para qué id se pidió: si llega
// una respuesta de otro id (el usuario ya abrió otro libro), se descarta.
interface SelectedProduct {
    productId: string;
    loading: boolean;
    product: Product | null;
    error: string | null;
}

const LOAD_PRODUCT_ERROR_MESSAGE =
    "No pudimos cargar el libro. Intentá de nuevo en unos minutos.";

// Guarda la lista completa de libros y es la única capa que habla con
// productService e imageService. Las pantallas piden cosas por useProducts().
// La lista se mantiene al día sola: Firestore avisa cada cambio
// (onSnapshot), así que agregar, editar o borrar no la actualiza a mano.
function ProductProvider({ children }: ProductProviderProps): JSX.Element {
    const [products, setProducts] = useState<Product[]>([]);
    // Arranca en true para que la pantalla muestre el Spinner y no un
    // "no hay libros" falso mientras llega la primera respuesta.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<SelectedProduct | null>(null);

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

    // Pide un libro puntual. Una sola lectura (getDoc), sin escucha.
    // Las respuestas de un id que ya no es el pedido se ignoran.
    const loadProductById = useCallback((id: string): void => {
        setSelected({ productId: id, loading: true, product: null, error: null });

        getProductById(id)
            .then((product) => {
                setSelected((previous) =>
                    previous !== null && previous.productId === id
                        ? { productId: id, loading: false, product, error: null }
                        : previous,
                );
            })
            .catch((err: unknown) => {
                console.error("No se pudo cargar el libro:", err);
                setSelected((previous) =>
                    previous !== null && previous.productId === id
                        ? {
                            productId: id,
                            loading: false,
                            product: null,
                            error: LOAD_PRODUCT_ERROR_MESSAGE,
                        }
                        : previous,
                );
            });
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

    const uploadImage = useCallback(
        (file: File): Promise<string> => uploadProductImage(file),
        [],
    );

    const selectedProduct = selected?.product ?? null;
    const selectedProductError = selected?.error ?? null;
    // Hasta que se pide el primer libro, se considera cargando.
    const selectedProductLoading = selected === null || selected.loading;

    const value = useMemo<ProductContextType>(
        () => ({
            products,
            loading,
            error,
            loadProducts,
            selectedProduct,
            selectedProductLoading,
            selectedProductError,
            loadProductById,
            addProduct,
            editProduct,
            removeProduct,
            uploadImage,
        }),
        [
            products,
            loading,
            error,
            loadProducts,
            selectedProduct,
            selectedProductLoading,
            selectedProductError,
            loadProductById,
            addProduct,
            editProduct,
            removeProduct,
            uploadImage,
        ],
    );

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export { ProductProvider };