import { describe, expect, it } from "vitest";

import { normalizeText } from "./text";

describe("normalizeText", () => {
    it("saca las tildes", () => {
        expect(normalizeText("Ficción")).toBe("ficcion");
    });

    it("pasa a minúsculas", () => {
        expect(normalizeText("FICCIÓN")).toBe("ficcion");
    });

    it("saca los espacios de los bordes", () => {
        expect(normalizeText("  Terror  ")).toBe("terror");
    });

    it("deja que distintas escrituras coincidan", () => {
        expect(normalizeText("García Márquez")).toBe(
            normalizeText("garcia marquez"),
        );
    });

    it("trata la ñ como n (comportamiento actual)", () => {
        expect(normalizeText("Año")).toBe("ano");
    });

    it("devuelve vacío si el texto es vacío", () => {
        expect(normalizeText("")).toBe("");
    });
});