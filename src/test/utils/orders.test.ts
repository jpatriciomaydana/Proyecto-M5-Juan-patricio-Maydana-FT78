import { describe, expect, it } from "vitest";

import {
    ALLOWED_TRANSITIONS,
    ORDER_STATUSES,
    STATUS_LABELS,
    formatDate,
    formatPrice,
    getNextStatuses,
} from "../../utils/orders";

describe("STATUS_LABELS", () => {
    it("traduce los cuatro estados", () => {
        expect(STATUS_LABELS).toEqual({
            pending: "Pendiente",
            processing: "En proceso",
            completed: "Completado",
            cancelled: "Cancelado",
        });
    });
});

describe("ORDER_STATUSES", () => {
    it("lista los cuatro estados en orden", () => {
        expect(ORDER_STATUSES).toEqual([
            "pending",
            "processing",
            "completed",
            "cancelled",
        ]);
    });
});

describe("getNextStatuses", () => {
    it("desde Pendiente se puede pasar a En proceso o Cancelado", () => {
        expect(getNextStatuses("pending")).toEqual(["processing", "cancelled"]);
    });

    it("desde En proceso se puede pasar a Completado o Cancelado", () => {
        expect(getNextStatuses("processing")).toEqual([
            "completed",
            "cancelled",
        ]);
    });

    it("Completado es final: no tiene siguientes", () => {
        expect(getNextStatuses("completed")).toEqual([]);
    });

    it("Cancelado es final: no tiene siguientes", () => {
        expect(getNextStatuses("cancelled")).toEqual([]);
    });
});

describe("ALLOWED_TRANSITIONS", () => {
    it("define transiciones para todos los estados", () => {
        expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(
            [...ORDER_STATUSES].sort(),
        );
    });

    it("solo apunta a estados que existen", () => {
        for (const status of ORDER_STATUSES) {
            for (const next of ALLOWED_TRANSITIONS[status]) {
                expect(ORDER_STATUSES).toContain(next);
            }
        }
    });

    it("ningún estado puede pasar a sí mismo", () => {
        for (const status of ORDER_STATUSES) {
            expect(ALLOWED_TRANSITIONS[status]).not.toContain(status);
        }
    });
});

describe("formatPrice", () => {
    it("formatea en pesos argentinos con separador de miles y dos decimales", () => {
        const result = formatPrice(12500);

        expect(result).toContain("$");
        expect(result).toContain("12.500,00");
    });

    it("formatea el cero", () => {
        expect(formatPrice(0)).toContain("0,00");
    });

    it("conserva los centavos", () => {
        expect(formatPrice(1999.5)).toContain("1.999,50");
    });
});

describe("formatDate", () => {
    it("incluye el día y el año", () => {
        const result = formatDate(new Date(2026, 0, 15, 10, 30));

        expect(result).toContain("15");
        expect(result).toContain("2026");
    });
});