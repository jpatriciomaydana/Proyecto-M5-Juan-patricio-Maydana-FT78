import { useEffect } from "react";
import type { JSX } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import ButtonLink from "../../components/common/ButtonLink";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import { useOrders } from "../../hooks/useOrders";
import { STATUS_LABELS, formatDate, formatPrice } from "../../utils/orders";

// Lo que Cart.tsx manda al navegar tras una compra.
interface OrderDetailLocationState {
    justPurchased?: boolean;
}

function OrderDetail(): JSX.Element {
    const { orderId } = useParams();
    const location = useLocation();
    const {
        selectedOrder,
        selectedOrderLoading,
        selectedOrderError,
        loadOrderById,
    } = useOrders();

    // true solo si se llegó desde la compra (no desde "Mis pedidos").
    const justPurchased =
        (location.state as OrderDetailLocationState | null)?.justPurchased ===
        true;

    // La pantalla pide el pedido al montarse; el Provider decide cómo.
    useEffect(() => {
        if (orderId) {
            loadOrderById(orderId);
        }
    }, [orderId, loadOrderById]);

    // Solo se muestra el pedido si es el que pide la URL.
    const order =
        selectedOrder && selectedOrder.id === orderId ? selectedOrder : null;

    if (selectedOrderLoading) {
        return (
            <section className="mx-auto max-w-md px-4 py-8">
                <Spinner label="Cargando pedido…" />
            </section>
        );
    }

    // Un solo camino de vuelta: el botón de abajo del mensaje.
    if (selectedOrderError || !order) {
        return (
            <section className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-8 text-center">
                <ErrorMessage
                    message={selectedOrderError ?? "No encontramos ese pedido."}
                />
                <ButtonLink to="/mis-pedidos">Ir a mis pedidos</ButtonLink>
            </section>
        );
    }

    const bookCount = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );

    return (
        <section className="mx-auto max-w-md px-4 py-8">
            <Link
                to="/mis-pedidos"
                className="text-sm text-forest underline hover:text-forest-dark"
            >
                ← Volver a mis pedidos
            </Link>

            {justPurchased && (
                <p
                    role="status"
                    className="m-0 mt-4 rounded-md border border-line bg-white px-4 py-3 text-center text-forest"
                >
                    <strong>¡Compra realizada!</strong> Registramos tu pedido.
                </p>
            )}

            {/* Ticket: tarjeta angosta con separadores punteados. */}
            <article className="mt-4 rounded-md border border-line bg-white p-6 shadow-sm">
                <header className="text-center">
                    <img
                        src="/logo.png"
                        alt="Logo de Librería Patagonia"
                        className="mx-auto h-20 w-auto"
                    />
                    <h1 className="m-0 mt-1 font-serif text-2xl text-forest">
                        Comprobante de pedido
                    </h1>
                    <span
                        className={`mt-3 inline-block rounded-full border border-line px-3 py-1 text-sm ${order.status === "cancelled"
                            ? "text-danger"
                            : "text-forest"
                            }`}
                    >
                        {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                </header>

                <dl className="m-0 mt-5 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted">Fecha</dt>
                        <dd className="m-0 text-right text-ink">
                            {formatDate(order.createdAt)}
                        </dd>
                    </div>
                    <div className="mt-2 flex justify-between gap-4">
                        <dt className="text-muted">Pedido</dt>
                        <dd className="m-0 break-all text-right text-ink">
                            {order.id}
                        </dd>
                    </div>
                </dl>

                <hr className="my-5 border-0 border-t border-dashed border-line" />

                <ul className="m-0 list-none p-0">
                    {order.items.map((item) => (
                        <li key={item.productId} className="mb-4 last:mb-0">
                            <p className="m-0 flex justify-between gap-4 text-ink">
                                <span className="font-serif">{item.title}</span>
                                <strong className="whitespace-nowrap">
                                    {formatPrice(item.price * item.quantity)}
                                </strong>
                            </p>
                            <p className="m-0 mt-1 text-sm text-muted">
                                {item.quantity} × {formatPrice(item.price)}
                            </p>
                        </li>
                    ))}
                </ul>

                <hr className="my-5 border-0 border-t border-dashed border-line" />

                <p className="m-0 flex items-baseline justify-between gap-4 text-ink">
                    <span>
                        Total ({bookCount} {bookCount === 1 ? "libro" : "libros"})
                    </span>
                    <strong className="font-serif text-2xl text-forest">
                        {formatPrice(order.total)}
                    </strong>
                </p>

                <p className="m-0 mt-5 text-center text-xs text-muted">
                    Compra simulada: no se realizó ningún cobro.
                </p>
            </article>
        </section>
    );
}

export default OrderDetail;