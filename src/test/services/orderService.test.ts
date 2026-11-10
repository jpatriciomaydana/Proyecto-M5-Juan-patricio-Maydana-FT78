
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
    saveCartItems: vi.fn(),
    auth: { currentUser: null as unknown },
    db: {},
}));

vi.mock("../../services/firebase", () => ({
    auth: mocks.auth,
    db: mocks.db,
}));

vi.mock("../../services/cartService", () => ({
    saveCartItems: mocks.saveCartItems,
}));

vi.mock("firebase/firestore", () => ({
    collection: mocks.collection,
    doc: mocks.doc,
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    orderBy: mocks.orderBy,
    query: mocks.query,
    updateDoc: mocks.updateDoc,
    where: mocks.where,
    Timestamp: class Timestamp {
        private date: Date;

        constructor(date: Date) {
            this.date = date;
        }

        toDate() {
            return this.date;
        }
    },
}));

import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
    Timestamp,
} from "firebase/firestore";

import {
    cancelOrder,
    createOrder,
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
} from "../../services/orderService";

import { saveCartItems } from "../../services/cartService";
import type { CartItem } from "../../types/cart";

const fakeCollection = { path: "orders" };
const fakeQuery = { path: "orders-query" };
const fakeDoc = { path: "orders/order-1" };

const MockTimestamp = Timestamp as unknown as new (date: Date) => Timestamp;

function makeOrderData(overrides: Record<string, unknown> = {}) {
    return {
        userId: "uid-1",
        items: [
            {
                productId: "p1",
                title: "Ficciones",
                description: "Colección de cuentos",
                price: 15000,
                quantity: 2,
            },
        ],
        total: 30000,
        status: "pending",
        createdAt: new MockTimestamp(new Date("2025-01-15T00:00:00Z")),
        ...overrides,
    };
}

function makeDocument(id: string, data: Record<string, unknown>) {
    return {
        id,
        data: () => data,
    };
}


function makeCartItems(): CartItem[] {
    return [];
}

function setCurrentUser() {
    const getIdToken = vi.fn().mockResolvedValue("token-de-prueba");

    mocks.auth.currentUser = {
        uid: "uid-1",
        getIdToken,
    };

    return getIdToken;
}

function mockFetchResponse(
    data: unknown,
    ok = true,
    status = 200,
) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok,
        status,
        json: vi.fn().mockResolvedValue(data),
    });

    vi.stubGlobal("fetch", fetchMock);

    return fetchMock;
}

beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();

    mocks.auth.currentUser = null;

    vi.mocked(collection).mockReturnValue(fakeCollection as never);
    vi.mocked(doc).mockReturnValue(fakeDoc as never);
    vi.mocked(query).mockReturnValue(fakeQuery as never);
    vi.mocked(orderBy).mockReturnValue("ORDER_BY" as never);
    vi.mocked(where).mockReturnValue("WHERE" as never);
});

describe("getUserOrders", () => {
    it("obtiene los pedidos del usuario ordenados por fecha descendente", async () => {
        vi.mocked(getDocs).mockResolvedValue({
            docs: [makeDocument("order-1", makeOrderData())],
        } as never);

        const result = await getUserOrders("uid-1");

        expect(collection).toHaveBeenCalledWith({}, "orders");
        expect(where).toHaveBeenCalledWith("userId", "==", "uid-1");
        expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
        expect(query).toHaveBeenCalledWith(
            fakeCollection,
            "WHERE",
            "ORDER_BY",
        );
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("order-1");
        expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it("devuelve una lista vacía cuando no hay pedidos", async () => {
        vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

        expect(await getUserOrders("uid-1")).toEqual([]);
    });
});

describe("getAllOrders", () => {
    it("obtiene todos los pedidos ordenados del más nuevo al más viejo", async () => {
        vi.mocked(getDocs).mockResolvedValue({
            docs: [
                makeDocument(
                    "order-old",
                    makeOrderData({
                        createdAt: new MockTimestamp(
                            new Date("2025-01-10T00:00:00Z"),
                        ),
                    }),
                ),
                makeDocument(
                    "order-new",
                    makeOrderData({
                        createdAt: new MockTimestamp(
                            new Date("2025-02-10T00:00:00Z"),
                        ),
                    }),
                ),
            ],
        } as never);

        const result = await getAllOrders();

        expect(getDocs).toHaveBeenCalledWith(fakeCollection);
        expect(result.map((order) => order.id)).toEqual([
            "order-new",
            "order-old",
        ]);
    });

    it("devuelve una lista vacía cuando no hay pedidos", async () => {
        vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

        expect(await getAllOrders()).toEqual([]);
    });
});

describe("getOrderById", () => {
    it("devuelve el pedido cuando existe", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            id: "order-1",
            data: () => makeOrderData(),
        } as never);

        const result = await getOrderById("order-1");

        expect(doc).toHaveBeenCalledWith({}, "orders", "order-1");
        expect(result).toEqual(
            expect.objectContaining({
                id: "order-1",
                userId: "uid-1",
                total: 30000,
                createdAt: expect.any(Date),
            }),
        );
    });

    it("devuelve null cuando el pedido no existe", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => false,
        } as never);

        expect(await getOrderById("inexistente")).toBeNull();
    });
});

describe("updateOrderStatus", () => {
    it("actualiza el estado del pedido", async () => {
        vi.mocked(updateDoc).mockResolvedValue(undefined);

        await updateOrderStatus("order-1", "processing");

        expect(doc).toHaveBeenCalledWith({}, "orders", "order-1");
        expect(updateDoc).toHaveBeenCalledWith(fakeDoc, {
            status: "processing",
        });
    });
});

describe("createOrder", () => {
    it("rechaza la compra si no hay un usuario autenticado", async () => {
        await expect(createOrder(makeCartItems())).rejects.toThrow(
            "Tenés que iniciar sesión para comprar.",
        );

        expect(saveCartItems).not.toHaveBeenCalled();
    });

    it("guarda el carrito y crea el pedido mediante la API", async () => {
        const getIdToken = setCurrentUser();

        vi.mocked(saveCartItems).mockResolvedValue(undefined);

        const fetchMock = mockFetchResponse({
            orderId: "order-123",
        });

        const result = await createOrder(makeCartItems());

        expect(saveCartItems).toHaveBeenCalledWith("uid-1", []);
        expect(getIdToken).toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/create-order",
            {
                method: "POST",
                headers: {
                    Authorization: "Bearer token-de-prueba",
                },
                body: undefined,
            },
        );
        expect(result).toBe("order-123");
    });

    it("rechaza una respuesta inesperada del servidor", async () => {
        setCurrentUser();
        vi.mocked(saveCartItems).mockResolvedValue(undefined);
        mockFetchResponse({ message: "sin orderId" });

        await expect(createOrder(makeCartItems())).rejects.toThrow(
            "Respuesta inesperada del servidor.",
        );
    });

    it("propaga el error enviado por el servidor", async () => {
        setCurrentUser();
        vi.mocked(saveCartItems).mockResolvedValue(undefined);
        mockFetchResponse(
            { error: "Stock insuficiente" },
            false,
            409,
        );

        await expect(createOrder(makeCartItems())).rejects.toThrow(
            "Stock insuficiente",
        );
    });

    it("usa el mensaje alternativo si el servidor no envía un error", async () => {
        setCurrentUser();
        vi.mocked(saveCartItems).mockResolvedValue(undefined);
        mockFetchResponse({}, false, 500);

        await expect(createOrder(makeCartItems())).rejects.toThrow(
            "No se pudo completar la compra. Intentá de nuevo.",
        );
    });
});

describe("cancelOrder", () => {
    it("rechaza la cancelación si no hay un usuario autenticado", async () => {
        await expect(cancelOrder("order-1")).rejects.toThrow(
            "Tenés que iniciar sesión para cancelar un pedido.",
        );
    });

    it("envía el id del pedido y el token a la API", async () => {
        const getIdToken = setCurrentUser();
        const fetchMock = mockFetchResponse({ success: true });

        await cancelOrder("order-1");

        expect(getIdToken).toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/cancel-order",
            {
                method: "POST",
                headers: {
                    Authorization: "Bearer token-de-prueba",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId: "order-1" }),
            },
        );
    });

    it("propaga el error enviado por el servidor", async () => {
        setCurrentUser();
        mockFetchResponse(
            { error: "No se puede cancelar el pedido" },
            false,
            403,
        );

        await expect(cancelOrder("order-1")).rejects.toThrow(
            "No se puede cancelar el pedido",
        );
    });
});
