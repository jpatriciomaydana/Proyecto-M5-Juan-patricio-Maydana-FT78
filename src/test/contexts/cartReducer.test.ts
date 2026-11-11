import { describe, expect, it } from "vitest";

import { cartReducer, initialCartState } from "../../contexts/cartReducer";
import type { CartReducerState } from "../../contexts/cartReducer";
import type { CartItem } from "../../types/cart";
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

function stateWith(items: CartItem[], owner = "guest"): CartReducerState {
    return { items, loadedOwner: owner };
}

describe("cartReducer", () => {
    describe("LOADED", () => {
        it("guarda los ítems y de quién son", () => {
            const items = [{ product: makeProduct(), quantity: 2 }];

            const result = cartReducer(initialCartState, {
                type: "LOADED",
                items,
                owner: "uid-1",
            });

            expect(result.items).toEqual(items);
            expect(result.loadedOwner).toBe("uid-1");
        });
    });

    describe("ADD_ITEM", () => {
        it("agrega un producto nuevo con cantidad 1", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([]), {
                type: "ADD_ITEM",
                product,
            });

            expect(result.items).toEqual([{ product, quantity: 1 }]);
        });

        it("suma 1 si el producto ya estaba en el carrito", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 1 }]), {
                type: "ADD_ITEM",
                product,
            });

            expect(result.items).toHaveLength(1);
            expect(result.items[0].quantity).toBe(2);
        });

        it("no supera el stock del producto", () => {
            const product = makeProduct({ stock: 2 });

            const result = cartReducer(stateWith([{ product, quantity: 2 }]), {
                type: "ADD_ITEM",
                product,
            });

            expect(result.items[0].quantity).toBe(2);
        });

        it("ignora un producto sin stock", () => {
            const state = stateWith([]);

            const result = cartReducer(state, {
                type: "ADD_ITEM",
                product: makeProduct({ stock: 0 }),
            });

            expect(result).toBe(state);
        });

        it("no toca a los otros productos del carrito", () => {
            const other = makeProduct({ id: "p2", title: "Otro libro" });
            const product = makeProduct();

            const result = cartReducer(
                stateWith([
                    { product: other, quantity: 3 },
                    { product, quantity: 1 },
                ]),
                { type: "ADD_ITEM", product },
            );

            expect(result.items[0].quantity).toBe(3);
            expect(result.items[1].quantity).toBe(2);
        });

        it("conserva el dueño del carrito", () => {
            const result = cartReducer(stateWith([], "uid-1"), {
                type: "ADD_ITEM",
                product: makeProduct(),
            });

            expect(result.loadedOwner).toBe("uid-1");
        });

        it("no modifica el estado original", () => {
            const product = makeProduct();
            const state = stateWith([{ product, quantity: 1 }]);

            cartReducer(state, { type: "ADD_ITEM", product });

            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(1);
        });
    });

    describe("UPDATE_QUANTITY", () => {
        it("cambia la cantidad", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 1 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: 4,
            });

            expect(result.items[0].quantity).toBe(4);
        });

        it("limita la cantidad al stock", () => {
            const product = makeProduct({ stock: 3 });

            const result = cartReducer(stateWith([{ product, quantity: 1 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: 10,
            });

            expect(result.items[0].quantity).toBe(3);
        });

        it("quita el ítem si la cantidad es 0", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 2 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: 0,
            });

            expect(result.items).toEqual([]);
        });

        it("quita el ítem si la cantidad es negativa", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 2 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: -3,
            });

            expect(result.items).toEqual([]);
        });

        it("quita el ítem si la cantidad es NaN", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 2 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: Number.NaN,
            });

            expect(result.items).toEqual([]);
        });

        it("quita el ítem si la cantidad es Infinity (cantidad inválida)", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 2 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: Number.POSITIVE_INFINITY,
            });

            expect(result.items).toEqual([]);
        });

        it("trunca los decimales (2.7 pasa a 2)", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 1 }]), {
                type: "UPDATE_QUANTITY",
                productId: "p1",
                quantity: 2.7,
            });

            expect(result.items[0].quantity).toBe(2);
        });

        it("solo cambia el producto indicado", () => {
            const first = makeProduct();
            const second = makeProduct({ id: "p2" });

            const result = cartReducer(
                stateWith([
                    { product: first, quantity: 1 },
                    { product: second, quantity: 1 },
                ]),
                { type: "UPDATE_QUANTITY", productId: "p2", quantity: 3 },
            );

            expect(result.items[0].quantity).toBe(1);
            expect(result.items[1].quantity).toBe(3);
        });

        it("no cambia nada si el producto no está en el carrito", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 2 }]), {
                type: "UPDATE_QUANTITY",
                productId: "no-existe",
                quantity: 4,
            });

            expect(result.items).toEqual([{ product, quantity: 2 }]);
        });
    });

    describe("REMOVE_ITEM", () => {
        it("quita el producto indicado", () => {
            const first = makeProduct();
            const second = makeProduct({ id: "p2" });

            const result = cartReducer(
                stateWith([
                    { product: first, quantity: 1 },
                    { product: second, quantity: 1 },
                ]),
                { type: "REMOVE_ITEM", productId: "p1" },
            );

            expect(result.items).toEqual([{ product: second, quantity: 1 }]);
        });

        it("no cambia nada si el producto no estaba", () => {
            const product = makeProduct();

            const result = cartReducer(stateWith([{ product, quantity: 1 }]), {
                type: "REMOVE_ITEM",
                productId: "no-existe",
            });

            expect(result.items).toEqual([{ product, quantity: 1 }]);
        });
    });

    describe("CLEAR_CART", () => {
        it("vacía los ítems y conserva el dueño", () => {
            const result = cartReducer(
                stateWith([{ product: makeProduct(), quantity: 2 }], "uid-1"),
                { type: "CLEAR_CART" },
            );

            expect(result.items).toEqual([]);
            expect(result.loadedOwner).toBe("uid-1");
        });
    });
});