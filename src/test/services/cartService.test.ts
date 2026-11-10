import { beforeEach, describe, expect, it, vi } from "vitest";

// Los mocks van antes de importar el servicio: así no se inicializa Firebase
// ni se lee ninguna variable VITE_*.
vi.mock("../../services/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    setDoc: vi.fn(),
}));

vi.mock("../../services/productService", () => ({
    getProductById: vi.fn(),
}));

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import {
    clearCartItems,
    getCartItems,
    parseCartLines,
    resolveCartLines,
    saveCartItems,
    toCartLines,
} from "../../services/cartService";
import { getProductById } from "../../services/productService";
import type { Product } from "../../types/product";

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: "p1",
        title: "Drácula",
        author: "Bram Stoker",
        description: "Novela de terror",
        price: 1000,
        categoryId: "Terror",
        stock: 5,
        imageUrl: "",
        isbn: "9780000000001",
        publisher: "Editorial de prueba",
        publicationYear: 1897,
        firstEdition: false,
        createdAt: new Date(0),
        ...overrides,
    };
}

const fakeRef = { path: "carts/uid-1" };

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(doc).mockReturnValue(fakeRef as never);
    vi.mocked(serverTimestamp).mockReturnValue("SERVER_TIMESTAMP" as never);
});

describe("parseCartLines", () => {
    it("devuelve vacío si lo recibido no es una lista", () => {
        expect(parseCartLines(undefined)).toEqual([]);
        expect(parseCartLines(null)).toEqual([]);
        expect(parseCartLines("hola")).toEqual([]);
        expect(parseCartLines({})).toEqual([]);
    });

    it("conserva las líneas válidas", () => {
        expect(
            parseCartLines([
                { productId: "p1", quantity: 2 },
                { productId: "p2", quantity: 1 },
            ]),
        ).toEqual([
            { productId: "p1", quantity: 2 },
            { productId: "p2", quantity: 1 },
        ]);
    });

    it("descarta entradas que no son objetos", () => {
        expect(parseCartLines([null, "x", 5, { productId: "p1", quantity: 1 }])).toEqual([
            { productId: "p1", quantity: 1 },
        ]);
    });

    it("descarta líneas sin productId válido", () => {
        expect(
            parseCartLines([
                { quantity: 1 },
                { productId: "", quantity: 1 },
                { productId: 7, quantity: 1 },
            ]),
        ).toEqual([]);
    });

    it("descarta cantidades que no son número finito", () => {
        expect(
            parseCartLines([
                { productId: "p1", quantity: "2" },
                { productId: "p2", quantity: Number.NaN },
                { productId: "p3", quantity: Number.POSITIVE_INFINITY },
                { productId: "p4" },
            ]),
        ).toEqual([]);
    });

    it("descarta cantidades de 0 o negativas", () => {
        expect(
            parseCartLines([
                { productId: "p1", quantity: 0 },
                { productId: "p2", quantity: -3 },
                { productId: "p3", quantity: 0.5 },
            ]),
        ).toEqual([]);
    });

    it("trunca las cantidades decimales", () => {
        expect(parseCartLines([{ productId: "p1", quantity: 2.9 }])).toEqual([
            { productId: "p1", quantity: 2 },
        ]);
    });

    it("suma las líneas repetidas del mismo libro", () => {
        expect(
            parseCartLines([
                { productId: "p1", quantity: 1 },
                { productId: "p2", quantity: 4 },
                { productId: "p1", quantity: 2 },
            ]),
        ).toEqual([
            { productId: "p1", quantity: 3 },
            { productId: "p2", quantity: 4 },
        ]);
    });
});

describe("toCartLines", () => {
    it("deja solo el id del libro y la cantidad", () => {
        expect(
            toCartLines([{ product: makeProduct({ id: "p9" }), quantity: 3 }]),
        ).toEqual([{ productId: "p9", quantity: 3 }]);
    });

    it("devuelve vacío para un carrito vacío", () => {
        expect(toCartLines([])).toEqual([]);
    });
});

describe("resolveCartLines", () => {
    it("trae cada libro actualizado con su cantidad", async () => {
        const product = makeProduct({ stock: 10 });
        vi.mocked(getProductById).mockResolvedValue(product);

        const result = await resolveCartLines([{ productId: "p1", quantity: 2 }]);

        expect(result).toEqual([{ product, quantity: 2 }]);
        expect(getProductById).toHaveBeenCalledWith("p1");
    });

    it("limita la cantidad al stock actual", async () => {
        vi.mocked(getProductById).mockResolvedValue(makeProduct({ stock: 2 }));

        const result = await resolveCartLines([{ productId: "p1", quantity: 5 }]);

        expect(result[0].quantity).toBe(2);
    });

    it("descarta un libro borrado", async () => {
        vi.mocked(getProductById).mockResolvedValue(null);

        const result = await resolveCartLines([{ productId: "p1", quantity: 1 }]);

        expect(result).toEqual([]);
    });

    it("descarta un libro sin stock", async () => {
        vi.mocked(getProductById).mockResolvedValue(makeProduct({ stock: 0 }));

        const result = await resolveCartLines([{ productId: "p1", quantity: 1 }]);

        expect(result).toEqual([]);
    });

    it("conserva los libros válidos aunque otros se descarten", async () => {
        const kept = makeProduct({ id: "p2" });
        vi.mocked(getProductById).mockImplementation(async (id) =>
            id === "p2" ? kept : null,
        );

        const result = await resolveCartLines([
            { productId: "p1", quantity: 1 },
            { productId: "p2", quantity: 1 },
        ]);

        expect(result).toEqual([{ product: kept, quantity: 1 }]);
    });
});

describe("getCartItems", () => {
    it("devuelve vacío si la cuenta no tiene carrito guardado", async () => {
        vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

        expect(await getCartItems("uid-1")).toEqual([]);
        expect(doc).toHaveBeenCalledWith({}, "carts", "uid-1");
    });

    it("lee el carrito guardado y relee los libros", async () => {
        const product = makeProduct({ stock: 10 });
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({ items: [{ productId: "p1", quantity: 2 }] }),
        } as never);
        vi.mocked(getProductById).mockResolvedValue(product);

        expect(await getCartItems("uid-1")).toEqual([{ product, quantity: 2 }]);
    });

    it("ignora los datos inválidos del carrito guardado", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({ items: "roto" }),
        } as never);

        expect(await getCartItems("uid-1")).toEqual([]);
        expect(getProductById).not.toHaveBeenCalled();
    });
});

describe("saveCartItems", () => {
    it("guarda solo las líneas y la marca de tiempo del servidor", async () => {
        vi.mocked(setDoc).mockResolvedValue(undefined);

        await saveCartItems("uid-1", [
            { product: makeProduct({ id: "p1" }), quantity: 2 },
        ]);

        expect(doc).toHaveBeenCalledWith({}, "carts", "uid-1");
        expect(setDoc).toHaveBeenCalledWith(fakeRef, {
            items: [{ productId: "p1", quantity: 2 }],
            updatedAt: "SERVER_TIMESTAMP",
        });
    });
});

describe("clearCartItems", () => {
    it("borra el carrito de la cuenta", async () => {
        vi.mocked(deleteDoc).mockResolvedValue(undefined);

        await clearCartItems("uid-1");

        expect(doc).toHaveBeenCalledWith({}, "carts", "uid-1");
        expect(deleteDoc).toHaveBeenCalledWith(fakeRef);
    });
});