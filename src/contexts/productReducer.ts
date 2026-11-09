import type { ProductsCursor } from "../services/productService";
import type { CategoryId, Product } from "../types/product";

// Libro puntual (detalle y edición). Guarda para qué id se pidió: si llega
// una respuesta de otro id (el usuario ya abrió otro libro), se descarta.
export interface SelectedProduct {
    productId: string;
    loading: boolean;
    product: Product | null;
    error: string | null;
}

// Página del catálogo. Guarda para qué categoría se pidió (null = "Todas"):
// si llega una respuesta de otra categoría, se descarta.
export interface CatalogState {
    categoryId: CategoryId | null;
    products: Product[];
    // Marca "hasta acá llegué". null cuando ya no quedan más libros.
    nextCursor: ProductsCursor | null;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    loadMoreError: string | null;
}

export interface ProductState {
    // Lista completa (onSnapshot): admin y buscador.
    products: Product[];
    loading: boolean;
    error: string | null;
    selected: SelectedProduct | null;
    // null hasta que se pide la primera página.
    catalog: CatalogState | null;
}

export type ProductAction =
    | { type: "LIST_LOADED"; products: Product[] }
    | { type: "LIST_FAILED"; message: string }
    | { type: "SELECTED_REQUESTED"; productId: string }
    | { type: "SELECTED_LOADED"; productId: string; product: Product | null }
    | { type: "SELECTED_FAILED"; productId: string; message: string }
    | { type: "CATALOG_REQUESTED"; categoryId: CategoryId | null }
    | {
        type: "CATALOG_LOADED";
        categoryId: CategoryId | null;
        products: Product[];
        nextCursor: ProductsCursor | null;
    }
    | {
        type: "CATALOG_FAILED";
        categoryId: CategoryId | null;
        message: string;
    }
    | { type: "CATALOG_MORE_REQUESTED"; categoryId: CategoryId | null }
    | {
        type: "CATALOG_MORE_LOADED";
        categoryId: CategoryId | null;
        products: Product[];
        nextCursor: ProductsCursor | null;
    }
    | {
        type: "CATALOG_MORE_FAILED";
        categoryId: CategoryId | null;
        message: string;
    };

// Arranca con loading en true para que la pantalla muestre el Spinner y no
// un "no hay libros" falso mientras llega la primera respuesta.
export const initialProductState: ProductState = {
    products: [],
    loading: true,
    error: null,
    selected: null,
    catalog: null,
};

// Reducer puro: recibe el estado y una acción, devuelve el estado nuevo.
// No llama a Firebase ni arma mensajes: eso lo hace ProductProvider.
export function productReducer(
    state: ProductState,
    action: ProductAction,
): ProductState {
    switch (action.type) {
        case "LIST_LOADED":
            return {
                ...state,
                products: action.products,
                loading: false,
                error: null,
            };

        case "LIST_FAILED":
            return { ...state, loading: false, error: action.message };

        case "SELECTED_REQUESTED":
            return {
                ...state,
                selected: {
                    productId: action.productId,
                    loading: true,
                    product: null,
                    error: null,
                },
            };

        case "SELECTED_LOADED":
            if (state.selected?.productId !== action.productId) {
                return state;
            }

            return {
                ...state,
                selected: {
                    productId: action.productId,
                    loading: false,
                    product: action.product,
                    error: null,
                },
            };

        case "SELECTED_FAILED":
            if (state.selected?.productId !== action.productId) {
                return state;
            }

            return {
                ...state,
                selected: {
                    productId: action.productId,
                    loading: false,
                    product: null,
                    error: action.message,
                },
            };

        case "CATALOG_REQUESTED":
            return {
                ...state,
                catalog: {
                    categoryId: action.categoryId,
                    products: [],
                    nextCursor: null,
                    loading: true,
                    loadingMore: false,
                    error: null,
                    loadMoreError: null,
                },
            };

        case "CATALOG_LOADED":
            if (state.catalog?.categoryId !== action.categoryId) {
                return state;
            }

            return {
                ...state,
                catalog: {
                    categoryId: action.categoryId,
                    products: action.products,
                    nextCursor: action.nextCursor,
                    loading: false,
                    loadingMore: false,
                    error: null,
                    loadMoreError: null,
                },
            };

        case "CATALOG_FAILED":
            if (state.catalog?.categoryId !== action.categoryId) {
                return state;
            }

            return {
                ...state,
                catalog: {
                    ...state.catalog,
                    loading: false,
                    error: action.message,
                },
            };

        case "CATALOG_MORE_REQUESTED":
            // Sin otra página o con un pedido en curso, no hace nada.
            if (
                state.catalog === null ||
                state.catalog.categoryId !== action.categoryId ||
                state.catalog.nextCursor === null ||
                state.catalog.loadingMore
            ) {
                return state;
            }

            return {
                ...state,
                catalog: {
                    ...state.catalog,
                    loadingMore: true,
                    loadMoreError: null,
                },
            };

        case "CATALOG_MORE_LOADED":
            if (state.catalog?.categoryId !== action.categoryId) {
                return state;
            }

            return {
                ...state,
                catalog: {
                    ...state.catalog,
                    products: [...state.catalog.products, ...action.products],
                    nextCursor: action.nextCursor,
                    loadingMore: false,
                    loadMoreError: null,
                },
            };

        case "CATALOG_MORE_FAILED":
            if (state.catalog?.categoryId !== action.categoryId) {
                return state;
            }

            return {
                ...state,
                catalog: {
                    ...state.catalog,
                    loadingMore: false,
                    loadMoreError: action.message,
                },
            };
    }
}