import { useContext } from "react";

import { OrderContext } from "../contexts/orderContextObject";
import type { OrderContextType } from "../contexts/orderContextObject";

export function useOrders(): OrderContextType {
    const context = useContext(OrderContext);

    if (!context) {
        throw new Error("useOrders debe utilizarse dentro de OrderProvider");
    }

    return context;
}