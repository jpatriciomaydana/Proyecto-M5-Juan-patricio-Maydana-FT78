
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboard from "../../../pages/admin/AdminDashboard";
import { useOrders } from "../../../hooks/useOrders";
import { useProducts } from "../../../hooks/useProducts";

vi.mock("../../../hooks/useOrders", () => ({
    useOrders: vi.fn(),
}));

vi.mock("../../../hooks/useProducts", () => ({
    useProducts: vi.fn(),
}));

const mockLoadProducts = vi.fn();
const mockLoadAdminOrders = vi.fn();

const products = [
    { id: "1", title: "Libro disponible", stock: 5 },
    { id: "2", title: "Libro agotado", stock: 0 },
];

const orders = [
    { id: "1", status: "completed", total: 15000 },
    { id: "2", status: "pending", total: 8000 },
];

function renderDashboard() {
    return render(
        <MemoryRouter>
            <AdminDashboard />
        </MemoryRouter>,
    );
}

describe("AdminDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useProducts).mockReturnValue({
            products,
            loading: false,
            error: null,
            loadProducts: mockLoadProducts,
        } as never);

        vi.mocked(useOrders).mockReturnValue({
            adminOrders: orders,
            adminOrdersLoading: false,
            adminOrdersError: null,
            loadAdminOrders: mockLoadAdminOrders,
        } as never);
    });

    it("carga productos y pedidos al mostrarse", () => {
        renderDashboard();

        expect(mockLoadProducts).toHaveBeenCalledOnce();
        expect(mockLoadAdminOrders).toHaveBeenCalledOnce();
    });

    it("muestra las estadísticas de libros, pedidos y ventas", () => {
        renderDashboard();

        expect(screen.getByText("2", { selector: "p" })).toBeInTheDocument();
        expect(screen.getByText("Libros en el catálogo")).toBeInTheDocument();
        expect(screen.getByText("Sin stock")).toBeInTheDocument();
        expect(screen.getByText("Pendiente")).toBeInTheDocument();
        expect(screen.getByText("Completado")).toBeInTheDocument();
        expect(
            screen.getByText("Ventas (pedidos completados)"),
        ).toBeInTheDocument();
        expect(screen.getByText("$ 15.000,00")).toBeInTheDocument();
    });

    it("muestra el indicador de carga", () => {
        vi.mocked(useProducts).mockReturnValue({
            products,
            loading: true,
            error: null,
            loadProducts: mockLoadProducts,
        } as never);

        renderDashboard();

        expect(screen.getByText("Cargando resumen...")).toBeInTheDocument();
        expect(screen.queryByText("Libros")).not.toBeInTheDocument();
    });

    it("muestra los errores de productos y pedidos", () => {
        vi.mocked(useProducts).mockReturnValue({
            products: [],
            loading: false,
            error: "Error al cargar productos",
            loadProducts: mockLoadProducts,
        } as never);

        vi.mocked(useOrders).mockReturnValue({
            adminOrders: [],
            adminOrdersLoading: false,
            adminOrdersError: "Error al cargar pedidos",
            loadAdminOrders: mockLoadAdminOrders,
        } as never);

        renderDashboard();

        expect(screen.getByText("Error al cargar productos")).toBeInTheDocument();
        expect(screen.getByText("Error al cargar pedidos")).toBeInTheDocument();
    });
});
