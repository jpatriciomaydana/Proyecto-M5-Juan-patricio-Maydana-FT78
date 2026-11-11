
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
    loadProducts: vi.fn(),
    removeProduct: vi.fn(),
    context: {
        products: [] as Array<{
            id: string;
            title: string;
            author: string;
            categoryId: string;
            price: number;
            stock: number;
        }>,
        loading: false,
        error: null as string | null,
        loadProducts: vi.fn(),
        removeProduct: vi.fn(),
    },
}));

vi.mock("../../../hooks/useProducts", () => ({
    useProducts: () => mocks.context,
}));

vi.mock("../../../hooks/useDebounce", () => ({
    useDebounce: (value: string) => value,
}));

import AdminProducts from "../../../pages/admin/AdminProducts";

const products = [
    {
        id: "1",
        title: "Ficciones",
        author: "Jorge Luis Borges",
        categoryId: "clasicos",
        price: 12000,
        stock: 5,
    },
    {
        id: "2",
        title: "El Hobbit",
        author: "J. R. R. Tolkien",
        categoryId: "Fantasía",
        price: 15000,
        stock: 0,
    },
];

function renderPage() {
    return render(
        <MemoryRouter>
            <AdminProducts />
        </MemoryRouter>,
    );
}

describe("AdminProducts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.context.products = [];
        mocks.context.loading = false;
        mocks.context.error = null;
        mocks.context.loadProducts = mocks.loadProducts;
        mocks.context.removeProduct = mocks.removeProduct;
        mocks.removeProduct.mockResolvedValue(undefined);
    });

    it("carga los productos al montar la pantalla", () => {
        renderPage();

        expect(mocks.loadProducts).toHaveBeenCalledTimes(1);
    });

    it("muestra el indicador de carga", () => {
        mocks.context.loading = true;

        renderPage();

        expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
    });

    it("muestra un error al fallar la carga", () => {
        mocks.context.error = "Error al cargar productos";

        renderPage();

        expect(screen.getByText("Error al cargar productos")).toBeInTheDocument();
    });

    it("muestra el estado vacío cuando no hay productos", () => {
        renderPage();

        expect(screen.getByText(/Todavía no hay productos cargados/i)).toBeInTheDocument();
    });

    it("muestra los productos y sus datos", () => {
        mocks.context.products = products;

        renderPage();

        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.getByText("Jorge Luis Borges")).toBeInTheDocument();
        expect(screen.getByText("Sin stock")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Nuevo producto" })).toHaveAttribute(
            "href",
            "/admin/productos/nuevo",
        );
    });

    it("filtra productos por título", () => {
        mocks.context.products = products;

        renderPage();

        fireEvent.change(screen.getByRole("searchbox"), {
            target: { value: "ficciones" },
        });

        expect(screen.getByText("Ficciones")).toBeInTheDocument();
        expect(screen.queryByText("El Hobbit")).not.toBeInTheDocument();
        expect(screen.getByText("1 de 2 productos")).toBeInTheDocument();
    });

    it("muestra un mensaje cuando la búsqueda no encuentra resultados", () => {
        mocks.context.products = products;

        renderPage();

        fireEvent.change(screen.getByRole("searchbox"), {
            target: { value: "inexistente" },
        });

        expect(screen.getByText("No encontramos productos")).toBeInTheDocument();
    });

    it("permite cancelar la confirmación de eliminación", () => {
        mocks.context.products = products;

        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Eliminar Ficciones" }));

        expect(screen.getByRole("group", {
            name: "Confirmar eliminación de Ficciones",
        })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.queryByRole("group")).not.toBeInTheDocument();
        expect(mocks.removeProduct).not.toHaveBeenCalled();
    });

    it("elimina el producto después de confirmar", async () => {
        mocks.context.products = products;

        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Eliminar Ficciones" }));
        fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

        await waitFor(() => {
            expect(mocks.removeProduct).toHaveBeenCalledWith("1");
        });
    });

    it("muestra un mensaje si no tiene permisos para eliminar", async () => {
        mocks.context.products = products;
        mocks.removeProduct.mockRejectedValue({ code: "permission-denied" });

        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Eliminar Ficciones" }));
        fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

        expect(await screen.findByText(/No tenés permisos para eliminar productos/i)).toBeInTheDocument();
    });
});
