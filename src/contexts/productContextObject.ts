import { createContext } from "react";

import type { CategoryId, Product, ProductInput } from "../types/product";

// Página del catálogo tal como la ve la pantalla. No incluye el cursor
// (eso es un detalle de Firestore): solo si hay más libros por cargar.
export interface CatalogView {
    // Categoría para la que se pidió esta página (null = "Todas").
    categoryId: CategoryId | null;
    products: Product[];
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    loadMoreError: string | null;
}

export interface ProductContextType {
    // Lista completa de libros, ordenada por título.
    products: Product[];
    loading: boolean;
    error: string | null;
    // Empieza a escuchar el catálogo. Solo la llama quien necesita la lista
    // completa (admin y buscador). Si ya está escuchando, no hace nada.
    loadProducts: () => void;
    // Libro puntual (detalle y edición). Si no existe, selectedProduct es
    // null, no está cargando y no hay error.
    selectedProduct: Product | null;
    selectedProductLoading: boolean;
    selectedProductError: string | null;
    loadProductById: (id: string) => void;
    // Catálogo paginado (modo "navegar"). null hasta que se pide la primera
    // página. La pantalla debe comparar catalog.categoryId con la categoría
    // que muestra: si no coinciden, todavía es la página de otra categoría.
    catalog: CatalogView | null;
    // Pide la primera página de una categoría (null = "Todas").
    loadCatalog: (categoryId: CategoryId | null) => void;
    // Pide la página siguiente de la categoría actual. Si no hay más o ya
    // hay un pedido en curso, no hace nada.
    loadMoreCatalog: () => void;
    addProduct: (input: ProductInput) => Promise<string>;
    editProduct: (id: string, input: ProductInput) => Promise<void>;
    removeProduct: (id: string) => Promise<void>;
    // Sube la imagen de un libro a S3 y devuelve su URL pública.
    uploadImage: (file: File) => Promise<string>;
}

export const ProductContext = createContext<ProductContextType | undefined>(
    undefined,
);