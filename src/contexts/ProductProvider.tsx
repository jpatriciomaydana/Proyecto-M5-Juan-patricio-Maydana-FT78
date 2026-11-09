import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
} from "react";
import type { JSX, ReactNode } from "react";

import { ProductContext } from "./productContextObject";
import type { CatalogView, ProductContextType } from "./productContextObject";
import { initialProductState, productReducer } from "./productReducer";
import { uploadProductImage } from "../services/imageService";
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProductsPage,
    subscribeToProducts,
    updateProduct,
} from "../services/productService";
import type { CategoryId, Product, ProductInput } from "../types/product";

interface ProductProviderProps {
    children: ReactNode;
}

const LOAD_LIST_ERROR_MESSAGE = "No pudimos cargar los libros. Intentá de nuevo.";
const LOAD_PRODUCT_ERROR_MESSAGE =
    "No pudimos cargar el libro. Intentá de nuevo en unos minutos.";
const LOAD_CATALOG_ERROR_MESSAGE =
    "No pudimos cargar los libros. Intentá nuevamente.";
const LOAD_MORE_ERROR_MESSAGE =
    "No pudimos cargar más libros. Intentá nuevamente.";

// Guarda el estado de los libros (lista completa, libro puntual y página del
// catálogo) con productReducer, y es la única capa que habla con
// productService e imageService. Las pantallas piden cosas por useProducts().
// El reducer solo cambia el estado; acá se llama a Firebase y se arman los
// mensajes de error.
// La lista completa se mantiene al día sola: Firestore avisa cada cambio
// (onSnapshot), así que agregar, editar o borrar no la actualiza a mano.
function ProductProvider({ children }: ProductProviderProps): JSX.Element {
    const [state, dispatch] = useReducer(productReducer, initialProductState);

    // Guarda la función para dejar de escuchar. Si es null, no estamos escuchando.
    const unsubscribeRef = useRef<(() => void) | null>(null);
    // Evita dos pedidos de "ver más" a la vez (doble clic antes de re-renderizar).
    const loadingMoreRef = useRef(false);

    const loadProducts = useCallback((): void => {
        if (unsubscribeRef.current) {
            return;
        }

        unsubscribeRef.current = subscribeToProducts(
            (list: Product[]) => {
                dispatch({ type: "LIST_LOADED", products: list });
            },
            (err) => {
                console.error(err);
                // Firestore corta la escucha cuando falla: se libera para poder reintentar.
                unsubscribeRef.current = null;
                dispatch({ type: "LIST_FAILED", message: LOAD_LIST_ERROR_MESSAGE });
            },
        );
    }, []);

    // Pide un libro puntual. Una sola lectura (getDoc), sin escucha.
    // El reducer ignora las respuestas de un id que ya no es el pedido.
    const loadProductById = useCallback((id: string): void => {
        dispatch({ type: "SELECTED_REQUESTED", productId: id });

        getProductById(id)
            .then((product) => {
                dispatch({ type: "SELECTED_LOADED", productId: id, product });
            })
            .catch((err: unknown) => {
                console.error("No se pudo cargar el libro:", err);
                dispatch({
                    type: "SELECTED_FAILED",
                    productId: id,
                    message: LOAD_PRODUCT_ERROR_MESSAGE,
                });
            });
    }, []);

    // Pide la primera página del catálogo de una categoría (null = "Todas").
    // El reducer ignora las respuestas de una categoría que ya no es la pedida.
    const loadCatalog = useCallback(
        async (categoryId: CategoryId | null): Promise<void> => {
            dispatch({ type: "CATALOG_REQUESTED", categoryId });

            try {
                const page = await getProductsPage(null, categoryId);
                dispatch({
                    type: "CATALOG_LOADED",
                    categoryId,
                    products: page.products,
                    nextCursor: page.nextCursor,
                });
            } catch (err: unknown) {
                console.error("Error al cargar los productos:", err);
                dispatch({
                    type: "CATALOG_FAILED",
                    categoryId,
                    message: LOAD_CATALOG_ERROR_MESSAGE,
                });
            }
        },
        [],
    );

    // Pide la página siguiente con el cursor guardado. Cambia cuando cambia
    // el catálogo, porque lee el cursor actual.
    const loadMoreCatalog = useCallback(async (): Promise<void> => {
        const catalog = state.catalog;

        if (
            catalog === null ||
            catalog.nextCursor === null ||
            loadingMoreRef.current
        ) {
            return;
        }

        const { categoryId, nextCursor } = catalog;

        loadingMoreRef.current = true;
        dispatch({ type: "CATALOG_MORE_REQUESTED", categoryId });

        try {
            const page = await getProductsPage(nextCursor, categoryId);
            dispatch({
                type: "CATALOG_MORE_LOADED",
                categoryId,
                products: page.products,
                nextCursor: page.nextCursor,
            });
        } catch (err: unknown) {
            console.error("Error al cargar más productos:", err);
            dispatch({
                type: "CATALOG_MORE_FAILED",
                categoryId,
                message: LOAD_MORE_ERROR_MESSAGE,
            });
        } finally {
            loadingMoreRef.current = false;
        }
    }, [state.catalog]);

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

    const { selected } = state;
    const selectedProduct = selected?.product ?? null;
    const selectedProductError = selected?.error ?? null;
    // Hasta que se pide el primer libro, se considera cargando.
    const selectedProductLoading = selected === null || selected.loading;

    // La pantalla ve el catálogo sin el cursor: solo si hay más libros.
    const catalog = useMemo<CatalogView | null>(() => {
        if (state.catalog === null) {
            return null;
        }

        return {
            categoryId: state.catalog.categoryId,
            products: state.catalog.products,
            hasMore: state.catalog.nextCursor !== null,
            loading: state.catalog.loading,
            loadingMore: state.catalog.loadingMore,
            error: state.catalog.error,
            loadMoreError: state.catalog.loadMoreError,
        };
    }, [state.catalog]);

    const { products, loading, error } = state;

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
            catalog,
            loadCatalog,
            loadMoreCatalog,
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
            catalog,
            loadCatalog,
            loadMoreCatalog,
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