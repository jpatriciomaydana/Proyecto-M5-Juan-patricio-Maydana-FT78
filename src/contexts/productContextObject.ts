import { createContext } from "react";

import type { Product, ProductInput } from "../types/product";

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
    addProduct: (input: ProductInput) => Promise<string>;
    editProduct: (id: string, input: ProductInput) => Promise<void>;
    removeProduct: (id: string) => Promise<void>;
    // Sube la imagen de un libro a S3 y devuelve su URL pública.
    uploadImage: (file: File) => Promise<string>;
}

export const ProductContext = createContext<ProductContextType | undefined>(
    undefined,
);