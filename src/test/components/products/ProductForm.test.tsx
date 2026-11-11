
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
    addProduct: vi.fn(),
    editProduct: vi.fn(),
    uploadImage: vi.fn(),
    navigate: vi.fn(),
}));

vi.mock("../../../hooks/useProducts", () => ({
    useProducts: () => ({
        addProduct: mocks.addProduct,
        editProduct: mocks.editProduct,
        uploadImage: mocks.uploadImage,
    }),
}));

import ProductForm from "../../../components/products/ProductForm";
import { EMPTY_VALUES } from "../../../utils/productForm";

function renderForm(productId?: string) {
    return render(
        <MemoryRouter>
            <ProductForm
                productId={productId}
                initialValues={{
                    ...EMPTY_VALUES,
                    title: "Ficciones",
                    author: "Jorge Luis Borges",
                    description: "Libro de cuentos",
                    price: "24000",
                    categoryId: "Novela",
                    stock: "5",
                    isbn: "978987",
                    publisher: "Editorial Sur",
                    publicationYear: "1944",
                }}
            />
        </MemoryRouter>,
    );
}

describe("ProductForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.addProduct.mockResolvedValue(undefined);
        mocks.editProduct.mockResolvedValue(undefined);
        mocks.uploadImage.mockResolvedValue("https://example.com/libro.jpg");
    });

    it("muestra los campos principales al crear un producto", () => {
        renderForm();

        expect(
            screen.getByRole("heading", { name: "Nuevo producto" }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Autor")).toHaveValue(
            "Jorge Luis Borges",
        );
        expect(screen.getByLabelText("Precio (ARS)")).toHaveValue(24000);
        expect(screen.getByLabelText("Stock")).toHaveValue(5);
        expect(
            screen.getByRole("button", { name: "Crear producto" }),
        ).toBeInTheDocument();
    });

    it("muestra errores al enviar el formulario vacío", () => {
        render(
            <MemoryRouter>
                <ProductForm initialValues={EMPTY_VALUES} />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Crear producto" }),
        );

        expect(screen.getByText("Ingresá el título.")).toBeInTheDocument();
        expect(screen.getByText("Ingresá el autor.")).toBeInTheDocument();
        expect(mocks.addProduct).not.toHaveBeenCalled();
    });

    it("crea un producto con datos válidos", async () => {
        renderForm();

        fireEvent.click(
            screen.getByRole("button", { name: "Crear producto" }),
        );

        await waitFor(() => {
            expect(mocks.addProduct).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Ficciones",
                    author: "Jorge Luis Borges",
                    price: 24000,
                    stock: 5,
                }),
            );
        });
    });

    it("muestra el modo edición y guarda los cambios", async () => {
        renderForm("producto123");

        expect(
            screen.getByRole("heading", { name: "Editar producto" }),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar cambios" }),
        );

        await waitFor(() => {
            expect(mocks.editProduct).toHaveBeenCalledWith(
                "producto123",
                expect.objectContaining({ title: "Ficciones" }),
            );
        });
    });

    it("muestra un error cuando no hay permisos para guardar", async () => {
        mocks.addProduct.mockRejectedValue({ code: "permission-denied" });

        renderForm();

        fireEvent.click(
            screen.getByRole("button", { name: "Crear producto" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "No tenés permisos para guardar productos.",
        );
    });

    it("muestra un error genérico si falla el guardado", async () => {
        mocks.addProduct.mockRejectedValue(new Error("Error interno"));

        renderForm();

        fireEvent.click(
            screen.getByRole("button", { name: "Crear producto" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "No pudimos guardar el producto.",
        );
    });

    it("muestra la vista previa de una URL de imagen válida", () => {
        render(
            <MemoryRouter>
                <ProductForm
                    initialValues={{
                        ...EMPTY_VALUES,
                        imageUrl: "https://example.com/libro.jpg",
                    }}
                />
            </MemoryRouter>,
        );

        expect(
            screen.getByAltText("Vista previa de la imagen del producto"),
        ).toHaveAttribute("src", "https://example.com/libro.jpg");
    });

    it("muestra un aviso cuando falla la vista previa", () => {
        render(
            <MemoryRouter>
                <ProductForm
                    initialValues={{
                        ...EMPTY_VALUES,
                        imageUrl: "https://example.com/libro.jpg",
                    }}
                />
            </MemoryRouter>,
        );

        fireEvent.error(
            screen.getByAltText("Vista previa de la imagen del producto"),
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "No pudimos mostrar la imagen",
        );
    });
});
