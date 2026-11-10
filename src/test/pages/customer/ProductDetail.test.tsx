
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { Product } from "../../../types/product";
import ProductDetail from "../../../pages/customer/ProductDetail";

const mocks = vi.hoisted(() => ({
    useCart: vi.fn(),
    useProducts: vi.fn(),
    addItem: vi.fn(),
    getQuantity: vi.fn(),
    loadProductById: vi.fn(),
}));

vi.mock("../../../hooks/useCart", () => ({
    useCart: mocks.useCart,
}));

vi.mock("../../../hooks/useProducts", () => ({
    useProducts: mocks.useProducts,
}));

const product: Product = {
    id: "book-1",
    title: "Ficciones",
    author: "Jorge Luis Borges",
    description: "Una colección de cuentos.",
    price: 12000,
    categoryId: "Clásicos",
    stock: 5,
    imageUrl: "https://example.com/ficciones.jpg",
    isbn: "9788420633125",
    publisher: "Alianza Editorial",
    publicationYear: 1944,
    firstEdition: true,
    createdAt: new Date("2026-01-01"),
};

function renderProductDetail(): void {
    render(
        <MemoryRouter initialEntries={["/catalogo/book-1"]}>
            <Routes>
                <Route
                    path="/catalogo/:id"
                    element={<ProductDetail />}
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe("ProductDetail", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.getQuantity.mockReturnValue(0);
        mocks.useCart.mockReturnValue({
            addItem: mocks.addItem,
            getQuantity: mocks.getQuantity,
        });

        mocks.useProducts.mockReturnValue({
            selectedProduct: product,
            selectedProductLoading: false,
            selectedProductError: null,
            loadProductById: mocks.loadProductById,
        });
    });

    it("solicita el libro según el id de la URL", () => {
        renderProductDetail();

        expect(mocks.loadProductById).toHaveBeenCalledWith("book-1");
    });

    it("muestra el indicador mientras carga el libro", () => {
        mocks.useProducts.mockReturnValue({
            selectedProduct: null,
            selectedProductLoading: true,
            selectedProductError: null,
            loadProductById: mocks.loadProductById,
        });

        renderProductDetail();

        expect(screen.getByText("Cargando libro...")).toBeInTheDocument();
    });

    it("muestra un error si falla la carga", () => {
        mocks.useProducts.mockReturnValue({
            selectedProduct: null,
            selectedProductLoading: false,
            selectedProductError: "No se pudo cargar el libro",
            loadProductById: mocks.loadProductById,
        });

        renderProductDetail();

        expect(screen.getByText("No se pudo cargar el libro")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Volver al catálogo" })).toBeInTheDocument();
    });

    it("muestra un mensaje cuando el libro no existe", () => {
        mocks.useProducts.mockReturnValue({
            selectedProduct: null,
            selectedProductLoading: false,
            selectedProductError: null,
            loadProductById: mocks.loadProductById,
        });

        renderProductDetail();

        expect(screen.getByText("Libro no encontrado")).toBeInTheDocument();
    });

    it("no muestra un libro cuyo id no coincide con la URL", () => {
        mocks.useProducts.mockReturnValue({
            selectedProduct: { ...product, id: "otro-libro" },
            selectedProductLoading: false,
            selectedProductError: null,
            loadProductById: mocks.loadProductById,
        });

        renderProductDetail();

        expect(screen.getByText("Libro no encontrado")).toBeInTheDocument();
    });

    it("muestra los datos principales y bibliográficos del libro", () => {
        renderProductDetail();

        expect(screen.getByRole("heading", { name: "Ficciones" })).toBeInTheDocument();
        expect(screen.getByText("Jorge Luis Borges")).toBeInTheDocument();
        expect(screen.getByText("Clásicos")).toBeInTheDocument();
        expect(screen.getByText("Una colección de cuentos.")).toBeInTheDocument();
        expect(screen.getByText("Primera edición")).toBeInTheDocument();
        expect(screen.getByText("9788420633125")).toBeInTheDocument();
        expect(screen.getByText("Alianza Editorial")).toBeInTheDocument();
        expect(screen.getByText("1944")).toBeInTheDocument();
        expect(screen.getByAltText("Portada de Ficciones")).toHaveAttribute(
            "src",
            product.imageUrl,
        );
    });

    it("muestra una alternativa cuando la imagen no está disponible", () => {
        mocks.useProducts.mockReturnValue({
            selectedProduct: { ...product, imageUrl: "" },
            selectedProductLoading: false,
            selectedProductError: null,
            loadProductById: mocks.loadProductById,
        });

        renderProductDetail();

        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("muestra una alternativa si la imagen produce un error", () => {
        renderProductDetail();

        fireEvent.error(screen.getByAltText("Portada de Ficciones"));

        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("muestra el stock disponible", () => {
        renderProductDetail();

        expect(screen.getByText("Stock disponible: 5")).toBeInTheDocument();
    });

    it("indica cuando el libro no tiene stock", () => {
        mocks.useProducts.mockReturnValue({
            selectedProduct: { ...product, stock: 0 },
            selectedProductLoading: false,
            selectedProductError: null,
            loadProductById: mocks.loadProductById,
        });

        renderProductDetail();

        expect(screen.getByText("Sin stock", { selector: "p" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sin stock: Ficciones" })).toBeDisabled();
    });

    it("muestra la cantidad del libro que ya está en el carrito", () => {
        mocks.getQuantity.mockReturnValue(2);

        renderProductDetail();

        expect(screen.getByText("En tu carrito: 2")).toBeInTheDocument();
    });

    it("permite agregar el libro al carrito", () => {
        renderProductDetail();

        fireEvent.click(screen.getByRole("button", { name: "Agregar: Ficciones" }));

        expect(mocks.addItem).toHaveBeenCalledWith(product);
        expect(screen.getByText("Agregado al carrito")).toBeInTheDocument();
    });

    it("deshabilita el botón cuando ya se alcanzó el stock máximo", () => {
        mocks.getQuantity.mockReturnValue(5);

        renderProductDetail();

        expect(
            screen.getByRole("button", { name: "Todo en tu carrito: Ficciones" }),
        ).toBeDisabled();
    });
});
