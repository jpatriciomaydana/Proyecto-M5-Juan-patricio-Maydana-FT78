
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
    loadAdminOrders: vi.fn(),
    changeStatus: vi.fn(),
    context: {
        adminOrders: [] as never[],
        adminOrdersLoading: false,
        adminOrdersError: null as string | null,
        loadAdminOrders: vi.fn(),
        changeStatus: vi.fn(),
        statusUpdatingId: null as string | null,
        statusUpdateError: null as string | null,
    },
}));

vi.mock("../../../hooks/useOrders", () => ({
    useOrders: () => mocks.context,
}));

vi.mock("../../../utils/orders", () => ({
    ORDER_STATUSES: ["pending", "processing", "completed", "cancelled"],
    STATUS_LABELS: {
        pending: "Pendiente",
        processing: "En proceso",
        completed: "Completado",
        cancelled: "Cancelado",
    },
    formatDate: () => "Fecha de prueba",
    formatPrice: (price: number) => `$${price}`,
    getNextStatuses: (status: string) => {
        if (status === "pending") return ["processing", "cancelled"];
        if (status === "processing") return ["completed", "cancelled"];
        return [];
    },
}));

import AdminOrders from "../../../pages/admin/AdminOrders";

const orders = [
    {
        id: "pedido1",
        userId: "usuario123456",
        items: [{ productId: "libro1", title: "Ficciones", quantity: 2 }],
        total: 24000,
        status: "pending",
        createdAt: new Date("2026-01-01"),
    },
    {
        id: "pedido2",
        userId: "usuario789",
        items: [{ productId: "libro2", title: "El Hobbit", quantity: 1 }],
        total: 15000,
        status: "completed",
        createdAt: new Date("2026-01-02"),
    },
];

function renderPage() {
    return render(
        <MemoryRouter>
            <AdminOrders />
        </MemoryRouter>,
    );
}

describe("AdminOrders", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.context.adminOrders = [];
        mocks.context.adminOrdersLoading = false;
        mocks.context.adminOrdersError = null;
        mocks.context.loadAdminOrders = mocks.loadAdminOrders;
        mocks.context.changeStatus = mocks.changeStatus;
        mocks.context.statusUpdatingId = null;
        mocks.context.statusUpdateError = null;
        mocks.changeStatus.mockResolvedValue(undefined);
    });

    it("carga los pedidos al montar", () => {
        renderPage();
        expect(mocks.loadAdminOrders).toHaveBeenCalledTimes(1);
    });

    it("muestra el indicador de carga", () => {
        mocks.context.adminOrdersLoading = true;
        renderPage();
        expect(screen.getByText("Cargando pedidos...")).toBeInTheDocument();
    });

    it("muestra un error al cargar los pedidos", () => {
        mocks.context.adminOrdersError = "Error al cargar pedidos";
        renderPage();
        expect(screen.getByText("Error al cargar pedidos")).toBeInTheDocument();
    });

    it("muestra un mensaje cuando no hay pedidos", () => {
        renderPage();
        expect(screen.getByText(/no hay pedidos registrados/i)).toBeInTheDocument();
    });

    it("muestra los pedidos y sus datos", () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        expect(screen.getByText(/Ficciones/)).toBeInTheDocument();
        expect(screen.getByText(/El Hobbit/)).toBeInTheDocument();
        expect(screen.getByText("$24000")).toBeInTheDocument();
        expect(screen.getAllByText("Fecha de prueba")).toHaveLength(2);
    });

    it("filtra los pedidos por estado", () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
            target: { value: "pending" },
        });

        expect(screen.getByText(/Ficciones/)).toBeInTheDocument();
        expect(screen.queryByText(/El Hobbit/)).not.toBeInTheDocument();
        expect(screen.getByText("1 de 2 pedidos")).toBeInTheDocument();
    });

    it("permite avanzar el estado de un pedido", async () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        fireEvent.change(
            screen.getByRole("combobox", {
                name: "Cambiar el estado del pedido pedido1",
            }),
            { target: { value: "processing" } },
        );

        await waitFor(() => {
            expect(mocks.changeStatus).toHaveBeenCalledWith("pedido1", "processing");
        });
    });

    it("pide confirmación antes de cancelar un pedido", () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        fireEvent.change(
            screen.getByRole("combobox", {
                name: "Cambiar el estado del pedido pedido1",
            }),
            { target: { value: "cancelled" } },
        );

        expect(screen.getByRole("group", {
            name: "Confirmar la cancelación del pedido pedido1",
        })).toBeInTheDocument();

        expect(mocks.changeStatus).not.toHaveBeenCalled();
    });

    it("cancela el pedido al confirmar", async () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        fireEvent.change(
            screen.getByRole("combobox", {
                name: "Cambiar el estado del pedido pedido1",
            }),
            { target: { value: "cancelled" } },
        );

        fireEvent.click(screen.getByRole("button", {
            name: "Sí, cancelar pedido",
        }));

        await waitFor(() => {
            expect(mocks.changeStatus).toHaveBeenCalledWith("pedido1", "cancelled");
        });
    });

    it("permite volver atrás sin cancelar", () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        fireEvent.change(
            screen.getByRole("combobox", {
                name: "Cambiar el estado del pedido pedido1",
            }),
            { target: { value: "cancelled" } },
        );

        fireEvent.click(screen.getByRole("button", { name: "No, volver" }));

        expect(screen.queryByRole("group")).not.toBeInTheDocument();
        expect(mocks.changeStatus).not.toHaveBeenCalled();
    });

    it("muestra el mensaje de error al actualizar un estado", () => {
        mocks.context.adminOrders = orders as never[];
        mocks.context.statusUpdateError = "No se pudo actualizar el pedido";
        renderPage();

        expect(screen.getByText("No se pudo actualizar el pedido")).toBeInTheDocument();
    });

    it("indica cuando un pedido ya está cerrado", () => {
        mocks.context.adminOrders = orders as never[];
        renderPage();

        expect(screen.getByText(/Este pedido está cerrado/i)).toBeInTheDocument();
    });
});
