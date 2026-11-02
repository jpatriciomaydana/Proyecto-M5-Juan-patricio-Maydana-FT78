import { useContext } from "react";

import { ProductContext } from "../contexts/productContextObject";
import type { ProductContextType } from "../contexts/productContextObject";

export function useProducts(): ProductContextType {
    const context = useContext(ProductContext);

    if (!context) {
        throw new Error("useProducts debe utilizarse dentro de ProductProvider");
    }

    return context;
}