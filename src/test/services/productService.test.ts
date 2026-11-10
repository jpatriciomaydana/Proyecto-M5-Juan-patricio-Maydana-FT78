
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
    addDoc: vi.fn(),
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(),
    startAfter: vi.fn(),
    Timestamp: class Timestamp {
        private date: Date;

        constructor(date: Date) {
            this.date = date;
        }

        toDate() {
            return this.date;
        }
    },
    updateDoc: vi.fn(),
    where: vi.fn(),
}));

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    startAfter,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    getProductsPage,
    subscribeToProducts,
    updateProduct,
} from "../../services/productService";
import type { Product, ProductInput } from "../../types/product";

const fakeCollection = { path: "products" };
const fakeQuery = { path: "products-query" };
const fakeDoc = { id: "p1", path: "products/p1" };
const fakeCursor = { id: "p20" };

function makeProductData(overrides: Partial<Product> = {}) {
    return {
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
        createdAt: new (Timestamp as unknown as new (date: Date) => Timestamp)(
            new Date("2025-01-15T00:00:00Z"),
        ),
        ...overrides,
    };
}

function makeDocument(
    id: string,
    data: Record<string, unknown> = makeProductData(),
) {
    return {
        id,
        data: () => data,
    };
}

function makeInput(): ProductInput {
    return {
        title: "Ficciones",
        author: "Jorge Luis Borges",
        description: "Colección de cuentos",
        price: 15000,
        categoryId: "Clásicos",
        stock: 10,
        imageUrl: "",
        isbn: "9780000000002",
        publisher: "Editorial de prueba",
        publicationYear: 1944,
        firstEdition: false,
    };
}

beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(collection).mockReturnValue(fakeCollection as never);
    vi.mocked(query).mockReturnValue(fakeQuery as never);
    vi.mocked(doc).mockReturnValue(fakeDoc as never);
    vi.mocked(orderBy).mockReturnValue("ORDER_BY" as never);
    vi.mocked(limit).mockReturnValue("LIMIT" as never);
    vi.mocked(where).mockReturnValue("WHERE" as never);
    vi.mocked(startAfter).mockReturnValue("START_AFTER" as never);
    vi.mocked(serverTimestamp).mockReturnValue("SERVER_TIMESTAMP" as never);
});

describe("getProducts", () => {
    it("obtiene los productos ordenados por título", async () => {
        vi.mocked(getDocs).mockResolvedValue({
            docs: [
                makeDocument("p1"),
                makeDocument("p2", makeProductData({ title: "Ficciones" })),
            ],
        } as never);

        const result = await getProducts();

        expect(collection).toHaveBeenCalledWith({}, "products");
        expect(orderBy).toHaveBeenCalledWith("title", "asc");
        expect(getDocs).toHaveBeenCalledWith(fakeQuery);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("p1");
        expect(result[1].title).toBe("Ficciones");
        expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it("devuelve una lista vacía si no hay productos", async () => {
        vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

        expect(await getProducts()).toEqual([]);
    });
});

describe("subscribeToProducts", () => {
    it("notifica los productos recibidos en tiempo real", () => {
        const onChange = vi.fn();
        const onError = vi.fn();
        const unsubscribe = vi.fn();

        vi.mocked(onSnapshot).mockImplementation(((
            _query: unknown,
            callback: (snapshot: {
                docs: ReturnType<typeof makeDocument>[];
            }) => void,
        ) => {
            callback({
                docs: [makeDocument("p1")],
            });
            return unsubscribe;
        }) as never);

        const result = subscribeToProducts(onChange, onError);

        expect(onChange).toHaveBeenCalledWith([
            expect.objectContaining({
                id: "p1",
                title: "Drácula",
            }),
        ]);
        expect(result).toBe(unsubscribe);
    });

    it("envía los errores al callback correspondiente", () => {
        const onChange = vi.fn();
        const onError = vi.fn();
        const error = new Error("Error de Firestore");

        vi.mocked(onSnapshot).mockImplementation(((
            _query: unknown,
            _callback: unknown,
            errorCallback: (error: Error) => void,
        ) => {
            errorCallback(error);
            return vi.fn();
        }) as never);

        subscribeToProducts(onChange, onError);

        expect(onError).toHaveBeenCalledWith(error);
    });
});

describe("getProductsPage", () => {
    it("obtiene la primera página sin cursor ni categoría", async () => {
        const documents = Array.from({ length: 20 }, (_, index) =>
            makeDocument(`p${index + 1}`),
        );

        vi.mocked(getDocs).mockResolvedValue({ docs: documents } as never);

        const result = await getProductsPage();

        expect(orderBy).toHaveBeenCalledWith("title", "asc");
        expect(limit).toHaveBeenCalledWith(21);
        expect(result.products).toHaveLength(20);
        expect(result.nextCursor).toBeNull();
    });

    it("devuelve un cursor cuando hay más productos", async () => {
        const documents = Array.from({ length: 21 }, (_, index) =>
            makeDocument(`p${index + 1}`),
        );

        vi.mocked(getDocs).mockResolvedValue({ docs: documents } as never);

        const result = await getProductsPage();

        expect(result.products).toHaveLength(20);
        expect(result.nextCursor).toBe(documents[19]);
    });

    it("filtra por categoría y utiliza el cursor recibido", async () => {
        vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

        await getProductsPage(fakeCursor as never, "Terror");

        expect(where).toHaveBeenCalledWith("categoryId", "==", "Terror");
        expect(startAfter).toHaveBeenCalledWith(fakeCursor);
        expect(query).toHaveBeenCalledWith(
            fakeCollection,
            "WHERE",
            "ORDER_BY",
            "START_AFTER",
            "LIMIT",
        );
    });
});

describe("getProductById", () => {
    it("devuelve el producto cuando existe", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            id: "p1",
            data: () => makeProductData(),
        } as never);

        const result = await getProductById("p1");

        expect(doc).toHaveBeenCalledWith({}, "products", "p1");
        expect(result).toEqual(
            expect.objectContaining({
                id: "p1",
                title: "Drácula",
                createdAt: expect.any(Date),
            }),
        );
    });

    it("devuelve null cuando el producto no existe", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => false,
        } as never);

        expect(await getProductById("inexistente")).toBeNull();
    });
});

describe("createProduct", () => {
    it("crea un producto con la fecha asignada por el servidor", async () => {
        vi.mocked(addDoc).mockResolvedValue({ id: "nuevo-id" } as never);

        const input = makeInput();
        const result = await createProduct(input);

        expect(addDoc).toHaveBeenCalledWith(fakeCollection, {
            ...input,
            createdAt: "SERVER_TIMESTAMP",
        });
        expect(result).toBe("nuevo-id");
    });
});

describe("updateProduct", () => {
    it("actualiza los datos del producto sin modificar createdAt", async () => {
        vi.mocked(updateDoc).mockResolvedValue(undefined);

        const input = makeInput();

        await updateProduct("p1", input);

        expect(doc).toHaveBeenCalledWith({}, "products", "p1");
        expect(updateDoc).toHaveBeenCalledWith(fakeDoc, input);
    });
});

describe("deleteProduct", () => {
    it("elimina el producto indicado", async () => {
        vi.mocked(deleteDoc).mockResolvedValue(undefined);

        await deleteProduct("p1");

        expect(doc).toHaveBeenCalledWith({}, "products", "p1");
        expect(deleteDoc).toHaveBeenCalledWith(fakeDoc);
    });
});
