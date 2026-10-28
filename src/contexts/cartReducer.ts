import type { CartItem } from "../types/cart";
import type { Product } from "../types/product";

// Estado que maneja el reducer: los ítems y de quién son
// (uid de la cuenta o "guest").
export interface CartReducerState {
    items: CartItem[];
    loadedOwner: string | null;
}

// Cada acción describe QUÉ pasó; el reducer decide cómo queda el estado.
export type CartAction =
    | { type: "LOADED"; items: CartItem[]; owner: string }
    | { type: "ADD_ITEM"; product: Product }
    | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
    | { type: "REMOVE_ITEM"; productId: string }
    | { type: "CLEAR_CART" };

export const initialCartState: CartReducerState = {
    items: [],
    loadedOwner: null,
};

// Función pura: dado un estado y una acción devuelve el estado nuevo,
// sin leer ni escribir nada fuera de sí misma. Por eso se puede testear
// sin React, sin Firebase y sin red.
export function cartReducer(
    state: CartReducerState,
    action: CartAction,
): CartReducerState {
    switch (action.type) {
        case "LOADED":
            return { items: action.items, loadedOwner: action.owner };

        case "ADD_ITEM": {
            const { product } = action;

            if (product.stock <= 0) {
                return state;
            }

            const existing = state.items.find(
                (item) => item.product.id === product.id,
            );

            if (!existing) {
                return {
                    ...state,
                    items: [...state.items, { product, quantity: 1 }],
                };
            }

            // Nunca superamos el stock del producto.
            const quantity = Math.min(existing.quantity + 1, product.stock);

            return {
                ...state,
                items: state.items.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity }
                        : item,
                ),
            };
        }

        case "UPDATE_QUANTITY": {
            const wanted = Math.floor(action.quantity);

            // Cantidad cero (o inválida): equivale a quitar el producto.
            if (!Number.isFinite(wanted) || wanted <= 0) {
                return {
                    ...state,
                    items: state.items.filter(
                        (item) => item.product.id !== action.productId,
                    ),
                };
            }

            return {
                ...state,
                items: state.items.map((item) =>
                    item.product.id === action.productId
                        ? {
                            ...item,
                            quantity: Math.min(wanted, item.product.stock),
                        }
                        : item,
                ),
            };
        }

        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter(
                    (item) => item.product.id !== action.productId,
                ),
            };

        case "CLEAR_CART":
            return { ...state, items: [] };
    }
}