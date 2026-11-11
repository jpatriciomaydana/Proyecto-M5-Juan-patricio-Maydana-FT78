
import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductProvider } from "../../contexts/ProductProvider";
import { useProducts } from "../../hooks/useProducts";
import type { Product, ProductInput } from "../../types/product";

const mocks = vi.hoisted(() => ({
    uploadProductImage: vi.fn(),
    createProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getProductById: vi.fn(),
    getProductsPage: vi.fn(),
    subscribeToProducts: vi.fn(),
    updateProduct: vi.fn(),
}));

vi.mock("../../services/imageService", () => ({
    uploadProductImage: mocks.uploadProductImage,
}));

vi.mock("../../services/productService", () => ({
    createProduct: mocks.createProduct,
    deleteProduct: mocks.deleteProduct,
    getProductById: mocks.getProductById,
    getProductsPage: mocks.getProductsPage,
    subscribeToProducts: mocks.subscribeToProducts,
    updateProduct: mocks.updateProduct,
}));

function Wrapper({ children }: PropsWithChildren) {
    return <ProductProvider>{children}</ProductProvider>;
}

function setup() {
    return renderHook(() => useProducts(), { wrapper: Wrapper });
}

const product = {
    id: "book-1",
    title: "Ficciones",
    author: "Jorge Luis Borges",
    price: 15000,
    stock: 5,
    categoryId: "Novela",
} as Product;

describe("ProductProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.getProductById.mockResolvedValue(product);
        mocks.getProductsPage.mockResolvedValue({
            products: [product],
            nextCursor: null,
        });
        mocks.createProduct.mockResolvedValue("book-new");
        mocks.updateProduct.mockResolvedValue(undefined);
        mocks.deleteProduct.mockResolvedValue(undefined);
        mocks.uploadProductImage.mockResolvedValue("https://example.com/book.jpg");
        mocks.subscribeToProducts.mockReturnValue(vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("carga la lista de productos mediante la suscripción", async () => {
        mocks.subscribeToProducts.mockImplementation((onSuccess) => {
            onSuccess([product]);
            return vi.fn();
        });

        const { result } = setup();

        act(() => {
            result.current.loadProducts();
        });

        await waitFor(() => {
            expect(result.current.products).toEqual([product]);
            expect(result.current.loading).toBe(false);
        });

        expect(mocks.subscribeToProducts).toHaveBeenCalledTimes(1);
    });

    it("no crea una segunda suscripción si ya está escuchando", () => {
        const { result } = setup();

        act(() => {
            result.current.loadProducts();
            result.current.loadProducts();
        });

        expect(mocks.subscribeToProducts).toHaveBeenCalledTimes(1);
    });

    it("carga un producto por su identificador", async () => {
        const { result } = setup();

        act(() => {
            result.current.loadProductById("book-1");
        });

        await waitFor(() => {
            expect(result.current.selectedProduct).toEqual(product);
            expect(result.current.selectedProductLoading).toBe(false);
        });

        expect(mocks.getProductById).toHaveBeenCalledWith("book-1");
    });

    it("guarda un error cuando falla la carga de un producto", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        mocks.getProductById.mockRejectedValue(new Error("Error"));

        const { result } = setup();

        act(() => {
            result.current.loadProductById("book-1");
        });

        await waitFor(() => {
            expect(result.current.selectedProduct).toBeNull();
            expect(result.current.selectedProductError).not.toBeNull();
        });
    });

    it("carga la primera página del catálogo", async () => {
        const { result } = setup();

        await act(async () => {
            await result.current.loadCatalog("Novela");
        });

        expect(mocks.getProductsPage).toHaveBeenCalledWith(null, "Novela");
        expect(result.current.catalog?.products).toEqual([product]);
        expect(result.current.catalog?.loading).toBe(false);
    });

    it("carga la siguiente página y agrega sus productos", async () => {
        const nextProduct = { ...product, id: "book-2", title: "El Aleph" };
        const cursor = { id: "cursor-1" };

        mocks.getProductsPage
            .mockResolvedValueOnce({
                products: [product],
                nextCursor: cursor,
            })
            .mockResolvedValueOnce({
                products: [nextProduct],
                nextCursor: null,
            });

        const { result } = setup();

        await act(async () => {
            await result.current.loadCatalog("Novela");
        });

        await act(async () => {
            await result.current.loadMoreCatalog();
        });

        expect(mocks.getProductsPage).toHaveBeenLastCalledWith(
            cursor,
            "Novela",
        );
        expect(result.current.catalog?.products).toEqual([
            product,
            nextProduct,
        ]);
        expect(result.current.catalog?.hasMore).toBe(false);
    });

    it("guarda un error cuando falla la carga del catálogo", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        mocks.getProductsPage.mockRejectedValue(new Error("Error"));

        const { result } = setup();

        await act(async () => {
            await result.current.loadCatalog("Novela");
        });

        expect(result.current.catalog?.loading).toBe(false);
        expect(result.current.catalog?.error).not.toBeNull();
    });

    it("crea, edita y elimina productos", async () => {
        const { result } = setup();
        const input = {} as ProductInput;

        await act(async () => {
            await result.current.addProduct(input);
            await result.current.editProduct("book-1", input);
            await result.current.removeProduct("book-1");
        });

        expect(mocks.createProduct).toHaveBeenCalledWith(input);
        expect(mocks.updateProduct).toHaveBeenCalledWith("book-1", input);
        expect(mocks.deleteProduct).toHaveBeenCalledWith("book-1");
    });

    it("sube una imagen y devuelve su URL", async () => {
        const { result } = setup();
        const file = new File(["image"], "book.jpg", {
            type: "image/jpeg",
        });

        let imageUrl = "";

        await act(async () => {
            imageUrl = await result.current.uploadImage(file);
        });

        expect(mocks.uploadProductImage).toHaveBeenCalledWith(file);
        expect(imageUrl).toBe("https://example.com/book.jpg");
    });
});
