import { describe, expect, it } from "vitest";

import {
    initialOrderState,
    orderReducer,
} from "../../contexts/orderReducer";
import type { OrderState } from "../../contexts/orderReducer";
import type { Order } from "../../types/order";

function makeOrder(overrides: Partial<Order> = {}): Order {
    return {
        id: "o1",
        userId: "uid-1",
        items: [
            {
                productId: "p1",
                title: "Drácula",
                description: "Novela de terror",
                price: 1000,
                quantity: 2,
            },
        ],
        total: 2000,
        status: "pending",
        createdAt: new Date(0),
        ...overrides,
    };
}

function stateWith(partial: Partial<OrderState>): OrderState {
    return { ...initialOrderState, ...partial };
}

describe("orderReducer", () => {
    describe("listas del usuario y del admin", () => {
        it("USER_LOADED guarda los pedidos con el uid de quien los pidió", () => {
            const orders = [makeOrder()];

            const result = orderReducer(initialOrderState, {
                type: "USER_LOADED",
                uid: "uid-1",
                orders,
            });

            expect(result.user).toEqual({ uid: "uid-1", orders, error: null });
        });

        it("USER_FAILED deja la lista vacía y guarda el error", () => {
            const result = orderReducer(initialOrderState, {
                type: "USER_FAILED",
                uid: "uid-1",
                error: "falló",
            });

            expect(result.user).toEqual({
                uid: "uid-1",
                orders: [],
                error: "falló",
            });
        });

        it("ADMIN_LOADED guarda los pedidos del admin", () => {
            const orders = [makeOrder(), makeOrder({ id: "o2" })];

            const result = orderReducer(initialOrderState, {
                type: "ADMIN_LOADED",
                uid: "admin-1",
                orders,
            });

            expect(result.admin).toEqual({
                uid: "admin-1",
                orders,
                error: null,
            });
        });

        it("ADMIN_FAILED deja la lista vacía y guarda el error", () => {
            const result = orderReducer(initialOrderState, {
                type: "ADMIN_FAILED",
                uid: "admin-1",
                error: "falló",
            });

            expect(result.admin).toEqual({
                uid: "admin-1",
                orders: [],
                error: "falló",
            });
        });

        it("una carga no toca la otra lista", () => {
            const state = stateWith({
                admin: { uid: "admin-1", orders: [makeOrder()], error: null },
            });

            const result = orderReducer(state, {
                type: "USER_LOADED",
                uid: "uid-1",
                orders: [],
            });

            expect(result.admin).toBe(state.admin);
        });
    });

    describe("pedido seleccionado", () => {
        const requested = stateWith({
            selected: {
                uid: "uid-1",
                orderId: "o1",
                loading: true,
                order: null,
                error: null,
            },
        });

        it("SELECTED_REQUESTED arranca cargando y sin pedido", () => {
            const result = orderReducer(initialOrderState, {
                type: "SELECTED_REQUESTED",
                uid: "uid-1",
                orderId: "o1",
            });

            expect(result.selected).toEqual({
                uid: "uid-1",
                orderId: "o1",
                loading: true,
                order: null,
                error: null,
            });
        });

        it("SELECTED_LOADED guarda el pedido si coincide uid y orderId", () => {
            const order = makeOrder();

            const result = orderReducer(requested, {
                type: "SELECTED_LOADED",
                uid: "uid-1",
                orderId: "o1",
                order,
            });

            expect(result.selected?.loading).toBe(false);
            expect(result.selected?.order).toBe(order);
            expect(result.selected?.error).toBeNull();
        });

        it("SELECTED_LOADED ignora la respuesta tardía de otro pedido", () => {
            const result = orderReducer(requested, {
                type: "SELECTED_LOADED",
                uid: "uid-1",
                orderId: "otro",
                order: makeOrder({ id: "otro" }),
            });

            expect(result).toBe(requested);
        });

        it("SELECTED_LOADED ignora la respuesta tardía de otra sesión", () => {
            const result = orderReducer(requested, {
                type: "SELECTED_LOADED",
                uid: "uid-2",
                orderId: "o1",
                order: makeOrder(),
            });

            expect(result).toBe(requested);
        });

        it("SELECTED_LOADED ignora la respuesta si no se pidió nada", () => {
            const result = orderReducer(initialOrderState, {
                type: "SELECTED_LOADED",
                uid: "uid-1",
                orderId: "o1",
                order: makeOrder(),
            });

            expect(result).toBe(initialOrderState);
        });

        it("SELECTED_FAILED guarda el error si coincide uid y orderId", () => {
            const result = orderReducer(requested, {
                type: "SELECTED_FAILED",
                uid: "uid-1",
                orderId: "o1",
                error: "falló",
            });

            expect(result.selected?.loading).toBe(false);
            expect(result.selected?.order).toBeNull();
            expect(result.selected?.error).toBe("falló");
        });

        it("SELECTED_FAILED ignora el error tardío de otro pedido", () => {
            const result = orderReducer(requested, {
                type: "SELECTED_FAILED",
                uid: "uid-1",
                orderId: "otro",
                error: "falló",
            });

            expect(result).toBe(requested);
        });

        it("SELECTED_FAILED ignora el error tardío de otra sesión", () => {
            const result = orderReducer(requested, {
                type: "SELECTED_FAILED",
                uid: "uid-2",
                orderId: "o1",
                error: "falló",
            });

            expect(result).toBe(requested);
        });
    });

    describe("compra en curso", () => {
        const placing = stateWith({
            placement: { uid: "uid-1", placing: true, error: null },
        });

        it("PLACE_ORDER_STARTED marca la compra en curso", () => {
            const result = orderReducer(initialOrderState, {
                type: "PLACE_ORDER_STARTED",
                uid: "uid-1",
            });

            expect(result.placement).toEqual({
                uid: "uid-1",
                placing: true,
                error: null,
            });
        });

        it("PLACE_ORDER_STARTED borra el error de una compra anterior", () => {
            const state = stateWith({
                placement: { uid: "uid-1", placing: false, error: "falló" },
            });

            const result = orderReducer(state, {
                type: "PLACE_ORDER_STARTED",
                uid: "uid-1",
            });

            expect(result.placement?.error).toBeNull();
        });

        it("PLACE_ORDER_SUCCEEDED termina la compra e invalida las listas", () => {
            const state = stateWith({
                user: { uid: "uid-1", orders: [makeOrder()], error: null },
                admin: { uid: "admin-1", orders: [makeOrder()], error: null },
                placement: placing.placement,
            });

            const result = orderReducer(state, {
                type: "PLACE_ORDER_SUCCEEDED",
                uid: "uid-1",
            });

            expect(result.placement).toEqual({
                uid: "uid-1",
                placing: false,
                error: null,
            });
            expect(result.user).toBeNull();
            expect(result.admin).toBeNull();
        });

        it("PLACE_ORDER_SUCCEEDED ignora la respuesta tardía de otra sesión", () => {
            const result = orderReducer(placing, {
                type: "PLACE_ORDER_SUCCEEDED",
                uid: "uid-2",
            });

            expect(result).toBe(placing);
        });

        it("PLACE_ORDER_SUCCEEDED ignora la respuesta si no había compra", () => {
            const result = orderReducer(initialOrderState, {
                type: "PLACE_ORDER_SUCCEEDED",
                uid: "uid-1",
            });

            expect(result).toBe(initialOrderState);
        });

        it("PLACE_ORDER_FAILED guarda el error y termina la compra", () => {
            const result = orderReducer(placing, {
                type: "PLACE_ORDER_FAILED",
                uid: "uid-1",
                error: "sin stock",
            });

            expect(result.placement).toEqual({
                uid: "uid-1",
                placing: false,
                error: "sin stock",
            });
        });

        it("PLACE_ORDER_FAILED ignora el error tardío de otra sesión", () => {
            const result = orderReducer(placing, {
                type: "PLACE_ORDER_FAILED",
                uid: "uid-2",
                error: "sin stock",
            });

            expect(result).toBe(placing);
        });
    });

    describe("cambio de estado", () => {
        it("STATUS_UPDATE_STARTED marca el pedido y borra el error anterior", () => {
            const state = stateWith({ statusUpdateError: "falló antes" });

            const result = orderReducer(state, {
                type: "STATUS_UPDATE_STARTED",
                orderId: "o1",
            });

            expect(result.statusUpdatingId).toBe("o1");
            expect(result.statusUpdateError).toBeNull();
        });

        it("STATUS_UPDATE_SUCCEEDED actualiza el estado en las listas y en el pedido seleccionado", () => {
            const order = makeOrder();
            const other = makeOrder({ id: "o2" });
            const state = stateWith({
                user: { uid: "uid-1", orders: [order, other], error: null },
                admin: { uid: "admin-1", orders: [order, other], error: null },
                selected: {
                    uid: "uid-1",
                    orderId: "o1",
                    loading: false,
                    order,
                    error: null,
                },
                statusUpdatingId: "o1",
            });

            const result = orderReducer(state, {
                type: "STATUS_UPDATE_SUCCEEDED",
                orderId: "o1",
                status: "processing",
            });

            expect(result.user?.orders[0].status).toBe("processing");
            expect(result.user?.orders[1].status).toBe("pending");
            expect(result.admin?.orders[0].status).toBe("processing");
            expect(result.admin?.orders[1].status).toBe("pending");
            expect(result.selected?.order?.status).toBe("processing");
            expect(result.statusUpdatingId).toBeNull();
        });

        it("STATUS_UPDATE_SUCCEEDED no toca el pedido seleccionado si es otro", () => {
            const selectedOrder = makeOrder({ id: "o2" });
            const state = stateWith({
                selected: {
                    uid: "uid-1",
                    orderId: "o2",
                    loading: false,
                    order: selectedOrder,
                    error: null,
                },
            });

            const result = orderReducer(state, {
                type: "STATUS_UPDATE_SUCCEEDED",
                orderId: "o1",
                status: "completed",
            });

            expect(result.selected?.order?.status).toBe("pending");
        });

        it("STATUS_UPDATE_SUCCEEDED deja en null las listas que no estaban cargadas", () => {
            const result = orderReducer(initialOrderState, {
                type: "STATUS_UPDATE_SUCCEEDED",
                orderId: "o1",
                status: "completed",
            });

            expect(result.user).toBeNull();
            expect(result.admin).toBeNull();
            expect(result.selected).toBeNull();
        });

        it("STATUS_UPDATE_FAILED guarda el error y libera el pedido", () => {
            const state = stateWith({ statusUpdatingId: "o1" });

            const result = orderReducer(state, {
                type: "STATUS_UPDATE_FAILED",
                error: "no tenés permiso",
            });

            expect(result.statusUpdatingId).toBeNull();
            expect(result.statusUpdateError).toBe("no tenés permiso");
        });
    });
});