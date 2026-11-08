import type { JSX } from "react";
import { Link } from "react-router-dom";

import type { Order } from "../../types/order";
import { STATUS_LABELS, formatDate, formatPrice } from "../../utils/orders";
import "./OrderCard.css";

interface OrderCardProps {
    order: Order;
}

function OrderCard({ order }: OrderCardProps): JSX.Element {
    const bookCount = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );

    return (
        <article className="order-card">
            <div className="order-card__header">
                <div>
                    <p className="order-card__date">
                        {formatDate(order.createdAt)}
                    </p>
                    <p className="order-card__id">Pedido {order.id}</p>
                </div>
                <span
                    className={`order-card__status order-card__status--${order.status}`}
                >
                    {STATUS_LABELS[order.status] ?? order.status}
                </span>
            </div>

            <p className="order-card__count">
                {bookCount} {bookCount === 1 ? "libro" : "libros"}
            </p>

            <p className="order-card__total">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
            </p>

            <Link
                to={`/mis-pedidos/${order.id}`}
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-forest underline hover:text-forest-dark focus-visible:outline focus-visible:outline-3 focus-visible:outline-gold"
            >
                Ver detalle
            </Link>
        </article>
    );
}

export default OrderCard;