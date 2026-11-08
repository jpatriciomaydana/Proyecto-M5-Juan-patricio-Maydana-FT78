import { useEffect, useState } from "react";
import type { JSX } from "react";

import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import { useOrders } from "../../hooks/useOrders";
import type { Order, OrderStatus } from "../../types/order";
import {
    ORDER_STATUSES,
    STATUS_LABELS,
    formatDate,
    formatPrice,
    getNextStatuses,
} from "../../utils/orders";
import "./AdminOrders.css";

type StatusFilter = "all" | OrderStatus;

function isStatusFilter(value: string): value is StatusFilter {
    return value === "all" || ORDER_STATUSES.some((status) => status === value);
}

// Devuelve el estado si el texto es uno válido; si no, null.
function parseStatus(value: string): OrderStatus | null {
    return ORDER_STATUSES.find((status) => status === value) ?? null;
}

// Los pedidos guardan el userId pero no el correo del cliente, así que
// mostramos un id corto y el completo queda en el tooltip.
function shortId(id: string): string {
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function AdminOrders(): JSX.Element {
    const {
        adminOrders: orders,
        adminOrdersLoading: loading,
        adminOrdersError: error,
        loadAdminOrders,
        changeStatus,
        statusUpdatingId: updatingId,
        statusUpdateError: updateError,
    } = useOrders();

    // Estado de UI que pertenece solo a esta pantalla.
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(
        null,
    );

    // La pantalla pide los pedidos al montarse; el Provider decide cómo.
    useEffect(() => {
        loadAdminOrders();
    }, [loadAdminOrders]);

    async function applyStatus(order: Order, status: OrderStatus): Promise<void> {
        // changeStatus nunca lanza error: si falla, deja el mensaje en
        // statusUpdateError y las listas quedan como estaban.
        await changeStatus(order.id, status);
        setConfirmingCancelId(null);
    }

    function handleSelectChange(order: Order, value: string): void {
        const nextStatus = parseStatus(value);

        // Solo se aceptan los estados permitidos desde el actual.
        if (!nextStatus || !getNextStatuses(order.status).includes(nextStatus)) {
            return;
        }

        // Cancelar es definitivo (el servidor repone el stock): pide
        // confirmación antes.
        if (nextStatus === "cancelled") {
            setConfirmingCancelId(order.id);
            return;
        }

        void applyStatus(order, nextStatus);
    }

    // El filtro es del lado del cliente: se traen todos los pedidos una vez
    // y el selector solo cambia cuáles se muestran.
    const visibleOrders =
        filter === "all"
            ? orders
            : orders.filter((order) => order.status === filter);

    const hasOrders = !loading && !error && orders.length > 0;
    const noOrdersAtAll = !loading && !error && orders.length === 0;

    return (
        <section className="admin-orders">
            <h1 className="admin-orders__title">Pedidos</h1>

            {loading && <Spinner label="Cargando pedidos..." />}

            {error && <ErrorMessage message={error} />}

            {updateError && <ErrorMessage message={updateError} />}

            {noOrdersAtAll && (
                <EmptyState
                    title="Todavía no hay pedidos registrados"
                    description="Cuando un cliente confirme una compra, la vas a ver acá."
                />
            )}

            {hasOrders && (
                <>
                    <div className="admin-orders__filter">
                        <label
                            htmlFor="admin-orders-filter"
                            className="admin-orders__filter-label"
                        >
                            Filtrar por estado
                        </label>
                        <select
                            id="admin-orders-filter"
                            className="admin-orders__select"
                            value={filter}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (isStatusFilter(value)) {
                                    setFilter(value);
                                }
                            }}
                        >
                            <option value="all">Todos</option>
                            {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {STATUS_LABELS[status]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <p className="admin-orders__count" role="status">
                        {visibleOrders.length} de {orders.length}{" "}
                        {orders.length === 1 ? "pedido" : "pedidos"}
                    </p>

                    {visibleOrders.length === 0 ? (
                        <EmptyState
                            title="No hay pedidos con ese estado"
                            description='Elegí otro estado o "Todos" para ver el resto.'
                        />
                    ) : (
                        <table
                            className="admin-orders__table"
                            aria-label="Listado de pedidos"
                        >
                            <thead>
                                <tr>
                                    <th scope="col">Fecha</th>
                                    <th scope="col">Cliente</th>
                                    <th scope="col">Productos</th>
                                    <th scope="col">Total</th>
                                    <th scope="col">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.map((order) => {
                                    const isConfirming =
                                        confirmingCancelId === order.id;
                                    const isUpdating = updatingId === order.id;
                                    // El selector muestra el estado actual y
                                    // solo los que se pueden alcanzar desde él.
                                    const nextStatuses = getNextStatuses(
                                        order.status,
                                    );
                                    const selectableStatuses = [
                                        order.status,
                                        ...nextStatuses,
                                    ];
                                    const isLocked = nextStatuses.length === 0;

                                    return (
                                        <tr key={order.id}>
                                            <td data-label="Fecha">
                                                <span className="admin-orders__date">
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </td>
                                            <td data-label="Cliente">
                                                <span title={order.userId}>
                                                    {shortId(order.userId)}
                                                </span>
                                            </td>
                                            <td className="admin-orders__cell-items">
                                                <ul className="admin-orders__items">
                                                    {order.items.map((item) => (
                                                        <li key={item.productId}>
                                                            {item.quantity} ×{" "}
                                                            {item.title}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td data-label="Total">
                                                <strong>
                                                    {formatPrice(order.total)}
                                                </strong>
                                            </td>
                                            <td data-label="Estado">
                                                <div className="admin-orders__status-cell">
                                                    <span
                                                        className={`admin-orders__status admin-orders__status--${order.status}`}
                                                    >
                                                        {STATUS_LABELS[order.status] ??
                                                            order.status}
                                                    </span>

                                                    {isLocked && (
                                                        <p className="admin-orders__hint">
                                                            Este pedido está
                                                            cerrado y ya no se
                                                            puede modificar.
                                                        </p>
                                                    )}

                                                    {!isLocked && !isConfirming && (
                                                        <select
                                                            className="admin-orders__select admin-orders__select--row"
                                                            aria-label={`Cambiar el estado del pedido ${shortId(order.id)}`}
                                                            value={order.status}
                                                            disabled={isUpdating}
                                                            onChange={(event) =>
                                                                handleSelectChange(
                                                                    order,
                                                                    event.target.value,
                                                                )
                                                            }
                                                        >
                                                            {selectableStatuses.map(
                                                                (status) => (
                                                                    <option
                                                                        key={status}
                                                                        value={status}
                                                                    >
                                                                        {
                                                                            STATUS_LABELS[
                                                                            status
                                                                            ]
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    )}

                                                    {isConfirming && (
                                                        <div
                                                            className="admin-orders__confirm"
                                                            role="group"
                                                            aria-label={`Confirmar la cancelación del pedido ${shortId(order.id)}`}
                                                        >
                                                            <p className="admin-orders__confirm-text">
                                                                ¿Cancelar este pedido?
                                                                No se puede deshacer.
                                                                Los libros vuelven al
                                                                stock.
                                                            </p>
                                                            <div className="admin-orders__actions">
                                                                <button
                                                                    type="button"
                                                                    className="admin-orders__confirm-yes"
                                                                    onClick={() =>
                                                                        void applyStatus(
                                                                            order,
                                                                            "cancelled",
                                                                        )
                                                                    }
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating
                                                                        ? "Cancelando..."
                                                                        : "Sí, cancelar pedido"}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="admin-orders__confirm-no"
                                                                    onClick={() =>
                                                                        setConfirmingCancelId(
                                                                            null,
                                                                        )
                                                                    }
                                                                    disabled={isUpdating}
                                                                    autoFocus
                                                                >
                                                                    No, volver
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </section>
    );
}

export default AdminOrders;