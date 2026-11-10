import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { CartContext } from "../../contexts/cartContextObject";
import type { CartContextType } from "../../contexts/cartContextObject";
import { useCart } from "../../hooks/useCart";

describe("useCart", () => {
    it("tira un error si se usa fuera de CartProvider", () => {
        // React escribe el error en la consola: se silencia solo en este test.
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });

        expect(() => renderHook(() => useCart())).toThrow(
            "useCart debe utilizarse dentro de CartProvider",
        );

        spy.mockRestore();
    });

    it("devuelve el valor del contexto", () => {
        const value = { itemCount: 3, total: 4500 } as unknown as CartContextType;

        function Wrapper({ children }: { children: ReactNode }) {
            return (
                <CartContext.Provider value={value}>
                    {children}
                </CartContext.Provider>
            );
        }

        const { result } = renderHook(() => useCart(), { wrapper: Wrapper });

        expect(result.current).toBe(value);
    });
});