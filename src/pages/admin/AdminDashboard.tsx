import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import ButtonLink from "../../components/common/ButtonLink";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import { useProducts } from "../../hooks/useProducts";
import { getAllOrders } from "../../services/orderService";
import type { Order } from "../../types/order";
import { ORDER_STATUSES, STATUS_LABELS, formatPrice } from "../../utils/orders";

interface StatCardProps {
    label: string;
    value: string | number;
}

// Tarjeta con un número grande y su descripción.
function StatCard({ label, value }: StatCardProps): JSX.Element {
    return (
        <div className="rounded-md border border-line bg-white p-4">
            <p className="m-0 text-sm text-muted">{label}</p>
            <p className="m-0 mt-1 font-serif text-2xl text-forest">{value}</p>
        </div>
    );
}

function AdminDashboard(): JSX.Element {
    // Libros: vienen del contexto (misma lista que usa AdminProducts).
    const {
        products,
        loading: productsLoading,
        error: productsError,
        loadProducts,
    } = useProducts();

    // Pedidos: se cargan una vez, con el mismo patrón que AdminOrders.
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
    const [ordersError, setOrdersError] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        let cancelled = false;

        getAllOrders()
            .then((data) => {
                if (!cancelled) {
                    setOrders(data);
                }
            })
            .catch((caught: unknown) => {
                console.error("No se pudieron cargar los pedidos:", caught);
                if (!cancelled) {
                    setOrdersError(
                        "No pudimos cargar los pedidos. Intentá de nuevo en unos minutos.",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setOrdersLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const outOfStock = useMemo(
        () => products.filter((product) => product.stock <= 0).length,
        [products],
    );

    const orderStats = useMemo(() => {
        const byStatus = ORDER_STATUSES.map((status) => ({
            status,
            count: orders.filter((order) => order.status === status).length,
        }));

        // Las ventas cuentan solo los pedidos completados.
        const sales = orders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + order.total, 0);

        return { byStatus, sales };
    }, [orders]);

    const loading = productsLoading || ordersLoading;

    return (
        <section className="px-4 py-8">
            <h1 className="font-serif text-2xl text-forest">
                Panel de administración
            </h1>
            <p className="mt-2 text-muted">
                Resumen de la librería y accesos para gestionarla.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/admin/productos">Gestionar productos</ButtonLink>
                <ButtonLink to="/admin/pedidos">Gestionar pedidos</ButtonLink>
            </div>

            {loading && (
                <div className="mt-8">
                    <Spinner label="Cargando resumen..." />
                </div>
            )}

            {!loading && productsError && (
                <div className="mt-8">
                    <ErrorMessage message={productsError} />
                </div>
            )}

            {!loading && ordersError && (
                <div className="mt-8">
                    <ErrorMessage message={ordersError} />
                </div>
            )}

            {!loading && !productsError && (
                <div className="mt-8">
                    <h2 className="font-serif text-xl text-forest">Libros</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard label="Libros en el catálogo" value={products.length} />
                        <StatCard label="Sin stock" value={outOfStock} />
                    </div>
                </div>
            )}

            {!loading && !ordersError && (
                <div className="mt-8">
                    <h2 className="font-serif text-xl text-forest">Pedidos</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {orderStats.byStatus.map(({ status, count }) => (
                            <StatCard
                                key={status}
                                label={STATUS_LABELS[status]}
                                value={count}
                            />
                        ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard
                            label="Ventas (pedidos completados)"
                            value={formatPrice(orderStats.sales)}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

export default AdminDashboard;