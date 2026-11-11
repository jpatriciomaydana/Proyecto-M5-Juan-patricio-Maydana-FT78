
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mocks = vi.hoisted(() => ({
    loadProductById: vi.fn(),
    productContext: {
        selectedProduct: null as null | { id: string },
        selectedProductLoading: false,
        selectedProductError: null as string | null,
        loadProductById: vi.fn(),
    },
}));

vi.mock("../../../hooks/useProducts", () => ({
    useProducts: () => mocks.productContext,
}));

vi.mock("../../../utils/productForm", () => ({
    EMPTY_VALUES: { title: "", author: "" },
    toFormValues: vi.fn(() => ({ title: "Ficciones", author: "Borges" })),
}));

vi.mock("../../../components/products/ProductForm", () => ({
    default: ({
        productId,
        initialValues,
    }: {
        productId?: string;
        initialValues: unknown;
    }) => (
        <div data-testid="product-form" data-product-id={productId ?? ""}>
            {JSON.stringify(initialValues)}
        </div>
    ),
}));

import AdminProductForm from "../../../pages/admin/AdminProductForm";

function renderPage(path = "/admin/productos/nuevo") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route
                    path="/admin/productos/nuevo"
                    element={<AdminProductForm />}
                />
                <Route
                    path="/admin/productos/:id/editar"
                    element={<AdminProductForm />}
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe("AdminProductForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.productContext.selectedProduct = null;
        mocks.productContext.selectedProductLoading = false;
        mocks.productContext.selectedProductError = null;
    });

    it("muestra el formulario vacío al crear un producto", () => {
        renderPage();

        expect(screen.getByTestId("product-form")).toBeInTheDocument();
        expect(screen.getByTestId("product-form")).toHaveTextContent(
            '{"title":"","author":""}',
        );
        expect(mocks.productContext.loadProductById).not.toHaveBeenCalled();
    });

    it("solicita el producto al entrar en modo edición", () => {
        renderPage("/admin/productos/123/editar");

        expect(mocks.productContext.loadProductById).toHaveBeenCalledWith("123");
    });

    it("muestra el estado de carga", () => {
        mocks.productContext.selectedProductLoading = true;

        renderPage("/admin/productos/123/editar");

        expect(screen.getByRole("status")).toHaveTextContent(
            "Cargando producto...",
        );
    });

    it("muestra el error recibido del contexto", () => {
        mocks.productContext.selectedProductError = "Error al cargar";

        renderPage("/admin/productos/123/editar");

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Error al cargar",
        );
        expect(
            screen.getByRole("link", { name: "Volver al listado" }),
        ).toHaveAttribute("href", "/admin/productos");
    });

    it("muestra un mensaje cuando el producto no existe", () => {
        renderPage("/admin/productos/123/editar");

        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Volver al listado" }),
        ).toBeInTheDocument();
    });

    it("muestra el formulario con el producto encontrado", () => {
        mocks.productContext.selectedProduct = { id: "123" };

        renderPage("/admin/productos/123/editar");

        expect(screen.getByTestId("product-form")).toHaveAttribute(
            "data-product-id",
            "123",
        );
        expect(screen.getByTestId("product-form")).toHaveTextContent(
            "Ficciones",
        );
    });

    it("no utiliza un producto distinto al solicitado en la URL", () => {
        mocks.productContext.selectedProduct = { id: "456" };

        renderPage("/admin/productos/123/editar");

        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.queryByTestId("product-form")).not.toBeInTheDocument();
    });
});
