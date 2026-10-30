import type { JSX } from "react";

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

            <details className="order-card__details">
                <summary className="order-card__summary">Ver detalle</summary>

                <ul className="order-card__items">
                    {order.items.map((item) => (
                        <li key={item.productId} className="order-card__item">
                            <p className="order-card__item-title">
                                {item.title}
                            </p>
                            {item.description && (
                                <p className="order-card__item-description">
                                    {item.description}
                                </p>
                            )}
                            <p className="order-card__item-line">
                                <span>
                                    {item.quantity} × {formatPrice(item.price)}
                                </span>
                                <strong>
                                    {formatPrice(item.price * item.quantity)}
                                </strong>
                            </p>
                        </li>
                    ))}
                </ul>
            </details>
        </article>
    );
}

export default OrderCard;