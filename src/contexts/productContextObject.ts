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
    addProduct: (input: ProductInput) => Promise<string>;
    editProduct: (id: string, input: ProductInput) => Promise<void>;
    removeProduct: (id: string) => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(
    undefined,
);