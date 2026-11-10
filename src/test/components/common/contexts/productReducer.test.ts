import { describe, expect, it } from "vitest";

import {
    initialProductState,
    productReducer,
} from "../../../../contexts/productReducer";
import type { CatalogState, ProductState } from "../../../../contexts/productReducer";
import type { ProductsCursor } from "../../../../services/productService";
import type { Product } from "../../../../types/product";

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

// El cursor real es un documento de Firestore. Acá alcanza con un objeto
// cualquiera: el reducer solo lo guarda, nunca lo usa. Se importa solo el
// TIPO (import type), así no se carga Firebase en el test.
const cursor = { id: "cursor-1" } as unknown as ProductsCursor;
const nextCursor = { id: "cursor-2" } as unknown as ProductsCursor;

function makeCatalog(overrides: Partial<CatalogState> = {}): CatalogState {
    return {
        categoryId: null,
        products: [],
        nextCursor: null,
        loading: false,
        loadingMore: false,
        error: null,
        loadMoreError: null,
        ...overrides,
    };
}

function stateWith(partial: Partial<ProductState>): ProductState {
    return { ...initialProductState, ...partial };
}

describe("productReducer", () => {
    it("arranca cargando, sin libros, sin libro seleccionado y sin catálogo", () => {
        expect(initialProductState.loading).toBe(true);
        expect(initialProductState.products).toEqual([]);
        expect(initialProductState.error).toBeNull();
        expect(initialProductState.selected).toBeNull();
        expect(initialProductState.catalog).toBeNull();
    });

    describe("lista completa", () => {
        it("LIST_LOADED guarda los libros y deja de cargar", () => {
            const products = [makeProduct(), makeProduct({ id: "p2" })];

            const result = productReducer(initialProductState, {
                type: "LIST_LOADED",
                products,
            });

            expect(result.products).toBe(products);
            expect(result.loading).toBe(false);
            expect(result.error).toBeNull();
        });

        it("LIST_LOADED borra un error anterior", () => {
            const state = stateWith({ loading: false, error: "falló" });

            const result = productReducer(state, {
                type: "LIST_LOADED",
                products: [],
            });

            expect(result.error).toBeNull();
        });

        it("LIST_FAILED guarda el error y deja de cargar", () => {
            const result = productReducer(initialProductState, {
                type: "LIST_FAILED",
                message: "falló",
            });

            expect(result.loading).toBe(false);
            expect(result.error).toBe("falló");
        });
    });

    describe("libro seleccionado", () => {
        const requested = stateWith({
            selected: {
                productId: "p1",
                loading: true,
                product: null,
                error: null,
            },
        });

        it("SELECTED_REQUESTED arranca cargando y sin libro", () => {
            const result = productReducer(initialProductState, {
                type: "SELECTED_REQUESTED",
                productId: "p1",
            });

            expect(result.selected).toEqual({
                productId: "p1",
                loading: true,
                product: null,
                error: null,
            });
        });

        it("SELECTED_LOADED guarda el libro si coincide el id", () => {
            const product = makeProduct();

            const result = productReducer(requested, {
                type: "SELECTED_LOADED",
                productId: "p1",
                product,
            });

            expect(result.selected).toEqual({
                productId: "p1",
                loading: false,
                product,
                error: null,
            });
        });

        it("SELECTED_LOADED con null: libro inexistente, sin error", () => {
            const result = productReducer(requested, {
                type: "SELECTED_LOADED",
                productId: "p1",
                product: null,
            });

            expect(result.selected?.loading).toBe(false);
            expect(result.selected?.product).toBeNull();
            expect(result.selected?.error).toBeNull();
        });

        it("SELECTED_LOADED ignora la respuesta tardía de otro libro", () => {
            const result = productReducer(requested, {
                type: "SELECTED_LOADED",
                productId: "otro",
                product: makeProduct({ id: "otro" }),
            });

            expect(result).toBe(requested);
        });

        it("SELECTED_LOADED ignora la respuesta si no se pidió ningún libro", () => {
            const result = productReducer(initialProductState, {
                type: "SELECTED_LOADED",
                productId: "p1",
                product: makeProduct(),
            });

            expect(result).toBe(initialProductState);
        });

        it("SELECTED_FAILED guarda el error si coincide el id", () => {
            const result = productReducer(requested, {
                type: "SELECTED_FAILED",
                productId: "p1",
                message: "falló",
            });

            expect(result.selected).toEqual({
                productId: "p1",
                loading: false,
                product: null,
                error: "falló",
            });
        });

        it("SELECTED_FAILED ignora el error tardío de otro libro", () => {
            const result = productReducer(requested, {
                type: "SELECTED_FAILED",
                productId: "otro",
                message: "falló",
            });

            expect(result).toBe(requested);
        });
    });

    describe("página del catálogo", () => {
        it("CATALOG_REQUESTED arranca cargando, vacío y sin cursor", () => {
            const result = productReducer(initialProductState, {
                type: "CATALOG_REQUESTED",
                categoryId: "Terror",
            });

            expect(result.catalog).toEqual({
                categoryId: "Terror",
                products: [],
                nextCursor: null,
                loading: true,
                loadingMore: false,
                error: null,
                loadMoreError: null,
            });
        });

        it("CATALOG_REQUESTED descarta la página de la categoría anterior", () => {
            const state = stateWith({
                catalog: makeCatalog({
                    categoryId: "Novela",
                    products: [makeProduct()],
                    nextCursor: cursor,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_REQUESTED",
                categoryId: "Terror",
            });

            expect(result.catalog?.categoryId).toBe("Terror");
            expect(result.catalog?.products).toEqual([]);
            expect(result.catalog?.nextCursor).toBeNull();
        });

        it("CATALOG_LOADED guarda libros y cursor si coincide la categoría", () => {
            const state = stateWith({
                catalog: makeCatalog({ categoryId: "Terror", loading: true }),
            });
            const products = [makeProduct()];

            const result = productReducer(state, {
                type: "CATALOG_LOADED",
                categoryId: "Terror",
                products,
                nextCursor: cursor,
            });

            expect(result.catalog?.products).toBe(products);
            expect(result.catalog?.nextCursor).toBe(cursor);
            expect(result.catalog?.loading).toBe(false);
            expect(result.catalog?.error).toBeNull();
        });

        it("CATALOG_LOADED funciona para 'Todas' (categoría null)", () => {
            const state = stateWith({
                catalog: makeCatalog({ categoryId: null, loading: true }),
            });

            const result = productReducer(state, {
                type: "CATALOG_LOADED",
                categoryId: null,
                products: [makeProduct()],
                nextCursor: null,
            });

            expect(result.catalog?.products).toHaveLength(1);
            expect(result.catalog?.nextCursor).toBeNull();
            expect(result.catalog?.loading).toBe(false);
        });

        it("CATALOG_LOADED ignora la respuesta tardía de otra categoría", () => {
            const state = stateWith({
                catalog: makeCatalog({ categoryId: "Novela", loading: true }),
            });

            const result = productReducer(state, {
                type: "CATALOG_LOADED",
                categoryId: "Terror",
                products: [makeProduct()],
                nextCursor: null,
            });

            expect(result).toBe(state);
        });

        it("CATALOG_LOADED ignora la respuesta si no se pidió ninguna página", () => {
            const result = productReducer(initialProductState, {
                type: "CATALOG_LOADED",
                categoryId: null,
                products: [makeProduct()],
                nextCursor: null,
            });

            expect(result).toBe(initialProductState);
        });

        it("CATALOG_FAILED guarda el error y deja de cargar", () => {
            const state = stateWith({
                catalog: makeCatalog({ categoryId: "Terror", loading: true }),
            });

            const result = productReducer(state, {
                type: "CATALOG_FAILED",
                categoryId: "Terror",
                message: "falló",
            });

            expect(result.catalog?.loading).toBe(false);
            expect(result.catalog?.error).toBe("falló");
        });

        it("CATALOG_FAILED ignora el error tardío de otra categoría", () => {
            const state = stateWith({
                catalog: makeCatalog({ categoryId: "Novela", loading: true }),
            });

            const result = productReducer(state, {
                type: "CATALOG_FAILED",
                categoryId: "Terror",
                message: "falló",
            });

            expect(result).toBe(state);
        });
    });

    describe("'ver más' del catálogo", () => {
        it("CATALOG_MORE_REQUESTED marca que se está cargando más", () => {
            const state = stateWith({
                catalog: makeCatalog({
                    nextCursor: cursor,
                    loadMoreError: "falló antes",
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_REQUESTED",
                categoryId: null,
            });

            expect(result.catalog?.loadingMore).toBe(true);
            expect(result.catalog?.loadMoreError).toBeNull();
        });

        it("CATALOG_MORE_REQUESTED no hace nada si no hay otra página", () => {
            const state = stateWith({
                catalog: makeCatalog({ nextCursor: null }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_REQUESTED",
                categoryId: null,
            });

            expect(result).toBe(state);
        });

        it("CATALOG_MORE_REQUESTED no hace nada si ya hay un pedido en curso", () => {
            const state = stateWith({
                catalog: makeCatalog({ nextCursor: cursor, loadingMore: true }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_REQUESTED",
                categoryId: null,
            });

            expect(result).toBe(state);
        });

        it("CATALOG_MORE_REQUESTED no hace nada si es de otra categoría", () => {
            const state = stateWith({
                catalog: makeCatalog({
                    categoryId: "Novela",
                    nextCursor: cursor,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_REQUESTED",
                categoryId: "Terror",
            });

            expect(result).toBe(state);
        });

        it("CATALOG_MORE_REQUESTED no hace nada si no hay catálogo", () => {
            const result = productReducer(initialProductState, {
                type: "CATALOG_MORE_REQUESTED",
                categoryId: null,
            });

            expect(result).toBe(initialProductState);
        });

        it("CATALOG_MORE_LOADED suma los libros a los que ya estaban y guarda el cursor nuevo", () => {
            const first = makeProduct({ id: "p1" });
            const second = makeProduct({ id: "p2" });
            const state = stateWith({
                catalog: makeCatalog({
                    products: [first],
                    nextCursor: cursor,
                    loadingMore: true,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_LOADED",
                categoryId: null,
                products: [second],
                nextCursor,
            });

            expect(result.catalog?.products).toEqual([first, second]);
            expect(result.catalog?.nextCursor).toBe(nextCursor);
            expect(result.catalog?.loadingMore).toBe(false);
        });

        it("CATALOG_MORE_LOADED con cursor null: ya no hay más libros", () => {
            const state = stateWith({
                catalog: makeCatalog({
                    nextCursor: cursor,
                    loadingMore: true,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_LOADED",
                categoryId: null,
                products: [makeProduct()],
                nextCursor: null,
            });

            expect(result.catalog?.nextCursor).toBeNull();
        });

        it("CATALOG_MORE_LOADED ignora la respuesta tardía de otra categoría", () => {
            const state = stateWith({
                catalog: makeCatalog({
                    categoryId: "Novela",
                    products: [makeProduct()],
                    nextCursor: cursor,
                    loadingMore: true,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_LOADED",
                categoryId: "Terror",
                products: [makeProduct({ id: "p2" })],
                nextCursor: null,
            });

            expect(result).toBe(state);
        });

        it("CATALOG_MORE_FAILED guarda el error sin perder los libros ya cargados", () => {
            const first = makeProduct();
            const state = stateWith({
                catalog: makeCatalog({
                    products: [first],
                    nextCursor: cursor,
                    loadingMore: true,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_FAILED",
                categoryId: null,
                message: "falló",
            });

            expect(result.catalog?.loadingMore).toBe(false);
            expect(result.catalog?.loadMoreError).toBe("falló");
            expect(result.catalog?.products).toEqual([first]);
            expect(result.catalog?.nextCursor).toBe(cursor);
        });

        it("CATALOG_MORE_FAILED ignora el error tardío de otra categoría", () => {
            const state = stateWith({
                catalog: makeCatalog({
                    categoryId: "Novela",
                    nextCursor: cursor,
                    loadingMore: true,
                }),
            });

            const result = productReducer(state, {
                type: "CATALOG_MORE_FAILED",
                categoryId: "Terror",
                message: "falló",
            });

            expect(result).toBe(state);
        });
    });
});