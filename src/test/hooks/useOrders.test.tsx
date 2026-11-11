
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderContext } from "../../contexts/orderContextObject";
import type { OrderContextType } from "../../contexts/orderContextObject";
import { useOrders } from "../../hooks/useOrders";

describe("useOrders", () => {
    it("devuelve el contexto cuando existe", () => {
        const context = {} as OrderContextType;

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <OrderContext.Provider value={context}>
                {children}
            </OrderContext.Provider>
        );

        const { result } = renderHook(() => useOrders(), { wrapper });

        expect(result.current).toBe(context);
    });

    it("lanza un error cuando se utiliza fuera de OrderProvider", () => {
        expect(() => renderHook(() => useOrders())).toThrow(
            "useOrders debe utilizarse dentro de OrderProvider",
        );
    });
});
