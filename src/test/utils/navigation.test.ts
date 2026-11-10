import { describe, expect, it } from "vitest";

import { getReturnTo } from "../../utils/navigation";

describe("getReturnTo", () => {
    it("devuelve la ruta interna que viene en el state", () => {
        expect(getReturnTo({ returnTo: "/carrito" })).toBe("/carrito");
    });

    it("acepta rutas internas con parámetros", () => {
        expect(getReturnTo({ returnTo: "/catalogo?categoria=Terror" })).toBe(
            "/catalogo?categoria=Terror",
        );
    });

    it("vuelve al catálogo si no hay state", () => {
        expect(getReturnTo(null)).toBe("/catalogo");
        expect(getReturnTo(undefined)).toBe("/catalogo");
    });

    it("vuelve al catálogo si el state no es un objeto", () => {
        expect(getReturnTo("/carrito")).toBe("/catalogo");
        expect(getReturnTo(42)).toBe("/catalogo");
    });

    it("vuelve al catálogo si el state no tiene returnTo", () => {
        expect(getReturnTo({})).toBe("/catalogo");
    });

    it("vuelve al catálogo si returnTo no es un texto", () => {
        expect(getReturnTo({ returnTo: 123 })).toBe("/catalogo");
        expect(getReturnTo({ returnTo: null })).toBe("/catalogo");
    });

    it("rechaza direcciones externas", () => {
        expect(getReturnTo({ returnTo: "https://sitio-malo.com" })).toBe(
            "/catalogo",
        );
    });

    it("rechaza rutas que empiezan con // (se interpretan como externas)", () => {
        expect(getReturnTo({ returnTo: "//sitio-malo.com" })).toBe("/catalogo");
    });

    it("rechaza rutas que no empiezan con /", () => {
        expect(getReturnTo({ returnTo: "carrito" })).toBe("/catalogo");
    });
});