
import { CartContext } from "../../../contexts/cartContextObject";
import type { CartContextType } from "../../../contexts/cartContextObject";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Catalog from "../../../pages/customer/Catalog";
import { ProductContext } from "../../../contexts/productContextObject";
import type {
    ProductContextType,
    CatalogView,
} from "../../../contexts/productContextObject";
import type { Product } from "../../../types/product";

const mocks = vi.hoisted(() => ({
    useDebounce: vi.fn(),
}));

vi.mock("../../../hooks/useDebounce", () => ({
    useDebounce: mocks.useDebounce,
}));

const product: Product = {
    id: "ficciones",
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

const anotherProduct: Product = {
    ...product,
    id: "el-alef",
    title: "El Aleph",
    author: "Jorge Luis Borges",
};

function createCatalog(
    overrides: Partial<CatalogView> = {},
): CatalogView {
    return {
        categoryId: null,
        products: [product],
        hasMore: false,
        loading: false,
        loadingMore: false,
        error: null,
        loadMoreError: null,
        ...overrides,
    };
}

function createProductContext(
    overrides: Partial<ProductContextType> = {},
): ProductContextType {
    return {
        products: [],
        loading: false,
        error: null,
        loadProducts: vi.fn(),
        selectedProduct: null,
        selectedProductLoading: false,
        selectedProductError: null,
        loadProductById: vi.fn(),
        catalog: createCatalog(),
        loadCatalog: vi.fn(),
        loadMoreCatalog: vi.fn(),
        addProduct: vi.fn(),
        editProduct: vi.fn(),
        removeProduct: vi.fn(),
        uploadImage: vi.fn(),
        ...overrides,
    };
}

const cartContext: CartContextType = {
    items: [],
    total: 0,
    itemCount: 0,
    loading: false,
    getQuantity: vi.fn(() => 0),
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
};

function renderCatalog(
    context: ProductContextType,
    initialEntry = "/catalogo",
) {
    return render(
        <CartContext.Provider value={cartContext}>
            <ProductContext.Provider value={context}>
                <MemoryRouter initialEntries={[initialEntry]}>
                    <Routes>
                        <Route path="/catalogo" element={<Catalog />} />
                        <Route
                            path="/catalogo/:id"
                            element={<p>Detalle del libro</p>}
                        />
                    </Routes>
                </MemoryRouter>
            </ProductContext.Provider>,
        </CartContext.Provider>
    );
}

describe("Catalog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useDebounce.mockImplementation((value: string) => value);
    });

    it("muestra el título y solicita el catálogo inicial", async () => {
        const context = createProductContext();

        renderCatalog(context);

        expect(
            screen.getByRole("heading", { name: "Catálogo" }),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(context.loadCatalog).toHaveBeenCalledWith(null);
        });
    });

    it("muestra el indicador mientras carga el catálogo", () => {
        const context = createProductContext({
            catalog: createCatalog({ loading: true }),
        });

        renderCatalog(context);

        expect(
            screen.getByText("Cargando libros..."),
        ).toBeInTheDocument();
    });

    it("muestra un indicador si todavía no hay catálogo", () => {
        const context = createProductContext({ catalog: null });

        renderCatalog(context);

        expect(
            screen.getByText("Cargando libros..."),
        ).toBeInTheDocument();
    });

    it("muestra un error al fallar la carga del catálogo", () => {
        const context = createProductContext({
            catalog: createCatalog({ error: "Error al cargar libros" }),
        });

        renderCatalog(context);

        expect(
            screen.getByText("Error al cargar libros"),
        ).toBeInTheDocument();
    });

    it("muestra los libros disponibles", () => {
        const context = createProductContext();

        renderCatalog(context);

        expect(
            screen.getByRole("link", { name: "Ficciones" }),
        ).toHaveAttribute("href", "/catalogo/ficciones");

        expect(
            screen.getByText("Jorge Luis Borges"),
        ).toBeInTheDocument();
    });

    it("muestra un mensaje cuando el catálogo está vacío", () => {
        const context = createProductContext({
            catalog: createCatalog({ products: [] }),
        });

        renderCatalog(context);

        expect(
            screen.getByText("Todavía no hay libros disponibles"),
        ).toBeInTheDocument();
    });

    it("muestra un mensaje cuando una categoría no tiene libros", () => {
        const context = createProductContext({
            catalog: createCatalog({
                categoryId: "Clásicos",
                products: [],
            }),
        });

        renderCatalog(context, "/catalogo?categoria=Cl%C3%A1sicos");

        expect(
            screen.getByText("No hay libros en esta categoría"),
        ).toBeInTheDocument();
    });

    it("solicita el catálogo de la categoría indicada en la URL", async () => {
        const context = createProductContext({
            catalog: createCatalog({
                categoryId: "Clásicos",
            }),
        });

        renderCatalog(context, "/catalogo?categoria=Cl%C3%A1sicos");

        await waitFor(() => {
            expect(context.loadCatalog).toHaveBeenCalledWith("Clásicos");
        });
    });

    it("ignora una categoría que no existe", async () => {
        const context = createProductContext();

        renderCatalog(context, "/catalogo?categoria=Inventada");

        await waitFor(() => {
            expect(context.loadCatalog).toHaveBeenCalledWith(null);
        });
    });

    it("muestra el botón para cargar más libros", async () => {
        const context = createProductContext({
            catalog: createCatalog({ hasMore: true }),
        });

        renderCatalog(context);

        fireEvent.click(
            screen.getByRole("button", { name: "Ver más libros" }),
        );

        expect(context.loadMoreCatalog).toHaveBeenCalledTimes(1);
    });

    it("deshabilita el botón mientras carga más libros", () => {
        const context = createProductContext({
            catalog: createCatalog({
                hasMore: true,
                loadingMore: true,
            }),
        });

        renderCatalog(context);

        expect(
            screen.getByRole("button", { name: "Cargando..." }),
        ).toBeDisabled();
    });

    it("muestra un error al cargar más libros", () => {
        const context = createProductContext({
            catalog: createCatalog({
                hasMore: true,
                loadMoreError: "No se pudieron cargar más libros",
            }),
        });

        renderCatalog(context);

        expect(
            screen.getByText("No se pudieron cargar más libros"),
        ).toBeInTheDocument();
    });

    it("carga la lista completa cuando hay una búsqueda", async () => {
        const context = createProductContext({
            products: [product],
        });

        renderCatalog(context, "/catalogo?q=ficciones");

        await waitFor(() => {
            expect(context.loadProducts).toHaveBeenCalledTimes(1);
        });
    });

    it("filtra los libros por título", () => {
        const context = createProductContext({
            products: [product, anotherProduct],
        });

        renderCatalog(context, "/catalogo?q=ficciones");

        expect(
            screen.getByRole("link", { name: "Ficciones" }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("link", { name: "El Aleph" }),
        ).not.toBeInTheDocument();
    });

    it("filtra los libros por autor", () => {
        const context = createProductContext({
            products: [product, {
                ...product,
                id: "otro-libro",
                title: "Otro libro",
                author: "Adolfo Bioy Casares",
            }],
        });

        renderCatalog(context, "/catalogo?q=bioy");

        expect(
            screen.getByRole("link", { name: "Otro libro" }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("link", { name: "Ficciones" }),
        ).not.toBeInTheDocument();
    });

    it("combina la búsqueda con la categoría seleccionada", () => {
        const context = createProductContext({
            products: [
                product,
                {
                    ...anotherProduct,
                    categoryId: "Novela",
                },
            ],
        });

        renderCatalog(
            context,
            "/catalogo?categoria=Cl%C3%A1sicos&q=borges",
        );

        expect(
            screen.getByRole("link", { name: "Ficciones" }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("link", { name: "El Aleph" }),
        ).not.toBeInTheDocument();
    });

    it("muestra un mensaje cuando la búsqueda no encuentra resultados", () => {
        const context = createProductContext({
            products: [product],
        });

        renderCatalog(context, "/catalogo?q=desconocido");

        expect(
            screen.getByText("No encontramos libros"),
        ).toBeInTheDocument();
    });

    it("muestra un indicador mientras carga los resultados de búsqueda", () => {
        const context = createProductContext({
            loading: true,
            products: [],
        });

        renderCatalog(context, "/catalogo?q=ficciones");

        expect(
            screen.getByText("Buscando libros..."),
        ).toBeInTheDocument();
    });

    it("muestra un error cuando falla la búsqueda", () => {
        const context = createProductContext({
            error: "Error al buscar libros",
        });

        renderCatalog(context, "/catalogo?q=ficciones");

        expect(
            screen.getByText("Error al buscar libros"),
        ).toBeInTheDocument();
    });

    it("muestra la cantidad de resultados encontrados", () => {
        const context = createProductContext({
            products: [product, anotherProduct],
        });

        renderCatalog(context, "/catalogo?q=borges");

        expect(screen.getByText(/2 resultados/)).toBeInTheDocument();
    });

    it("muestra un solo resultado en singular", () => {
        const context = createProductContext({
            products: [product],
        });

        renderCatalog(context, "/catalogo?q=ficciones");

        expect(screen.getByText(/1 resultado/)).toBeInTheDocument();
    });

    it("espera el debounce antes de mostrar la búsqueda", () => {
        mocks.useDebounce.mockReturnValue("");

        const context = createProductContext();

        renderCatalog(context, "/catalogo?q=ficciones");

        expect(context.loadCatalog).toHaveBeenCalledWith(null);
        expect(context.loadProducts).not.toHaveBeenCalled();
    });

    it("conserva el término de búsqueda en los enlaces de categoría", () => {
        const context = createProductContext({
            products: [product],
        });

        renderCatalog(context, "/catalogo?q=ficciones");

        expect(
            screen.getByRole("link", { name: "Clásicos" }),
        ).toHaveAttribute(
            "href",
            "/catalogo?categoria=Cl%C3%A1sicos&q=ficciones",
        );
    });

    it("muestra la categoría activa en la navegación", () => {
        const context = createProductContext({
            catalog: createCatalog({
                categoryId: "Clásicos",
            }),
        });

        renderCatalog(context, "/catalogo?categoria=Cl%C3%A1sicos");

        expect(
            screen.getByRole("link", { name: "Clásicos" }),
        ).toHaveAttribute("aria-current", "page");
    });
});
