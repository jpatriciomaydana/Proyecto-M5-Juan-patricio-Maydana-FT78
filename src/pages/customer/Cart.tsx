import { useState } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/common/EmptyState";
import { CartIcon } from "../../components/common/Icons";
import Spinner from "../../components/common/Spinner";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useCart } from "../../hooks/useCart";
import { createOrder } from "../../services/orderService";
import type { CartItem } from "../../types/cart";
import { formatPrice } from "../../utils/orders";
import "./Cart.css";

interface CartRowProps {
    item: CartItem;
    locked: boolean;
}

function CartRow({ item, locked }: CartRowProps): JSX.Element {
    const { updateQuantity, removeItem } = useCart();
    const [imageFailed, setImageFailed] = useState(false);

    const { product, quantity } = item;
    const hasImage = product.imageUrl.trim() !== "" && !imageFailed;
    const atMaxStock = quantity >= product.stock;

    return (
        <li className="cart-item">
            <div className="cart-item__media">
                {hasImage ? (
                    <img
                        src={product.imageUrl}
                        alt={`Portada de ${product.title}`}
                        className="cart-item__image"
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div
                        className="cart-item__placeholder"
                        aria-hidden="true"
                    >
                        <span>{product.title}</span>
                    </div>
                )}
            </div>

            <div className="cart-item__info">
                <h2 className="cart-item__title">
                    <Link
                        to={`/catalogo/${product.id}`}
                        className="cart-item__link"
                    >
                        {product.title}
                    </Link>
                </h2>
                <p className="cart-item__author">{product.author}</p>
                <p className="cart-item__price">
                    {formatPrice(product.price)} c/u
                </p>
            </div>

            <div className="cart-item__controls">
                <div
                    className="cart-item__qty"
                    role="group"
                    aria-label={`Cantidad de ${product.title}`}
                >
                    <button
                        type="button"
                        className="cart-item__qty-btn"
                        aria-label={`Quitar una unidad de ${product.title}`}
                        disabled={quantity <= 1 || locked}
                        onClick={() =>
                            updateQuantity(product.id, quantity - 1)
                        }
                    >
                        −
                    </button>

                    <span className="cart-item__qty-value">{quantity}</span>

                    <button
                        type="button"
                        className="cart-item__qty-btn"
                        aria-label={`Agregar una unidad de ${product.title}`}
                        disabled={atMaxStock || locked}
                        onClick={() =>
                            updateQuantity(product.id, quantity + 1)
                        }
                    >
                        +
                    </button>
                </div>

                <p className="cart-item__subtotal">
                    {formatPrice(product.price * quantity)}
                </p>

                <button
                    type="button"
                    className="cart-item__remove"
                    aria-label={`Quitar ${product.title} del carrito`}
                    disabled={locked}
                    onClick={() => removeItem(product.id)}
                >
                    Quitar
                </button>
            </div>

            {atMaxStock && (
                <p className="cart-item__note">
                    Llegaste al máximo disponible ({product.stock}).
                </p>
            )}
        </li>
    );
}

function Cart(): JSX.Element {
    const { user } = useAuthContext();
    const { items, total, itemCount, loading, clearCart } = useCart();

    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [orderId, setOrderId] = useState<string | null>(null);

    function handleClear(): void {
        if (window.confirm("¿Querés vaciar el carrito?")) {
            clearCart();
        }
    }

    async function handleConfirm(): Promise<void> {
        if (!user || submitting) {
            return;
        }

        setSubmitting(true);
        setOrderError("");

        try {
            const newOrderId = await createOrder(items);

            // Compra hecha: el servidor ya vació el carrito de la cuenta.
            // Acá se vacía el de la pantalla.
            clearCart();
            setOrderId(newOrderId);
        } catch (error) {
            console.error("Error al confirmar la compra:", error);
            setOrderError(
                error instanceof Error
                    ? error.message
                    : "No se pudo completar la compra. Intentá de nuevo.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <section className="cart-page">
                <h1 className="cart-page__title">Carrito</h1>
                <Spinner label="Cargando carrito…" />
            </section>
        );
    }

    // Va antes del carrito vacío: tras comprar, el carrito queda vacío
    // y igual queremos mostrar la confirmación.
    if (orderId) {
        return (
            <section className="cart-page">
                <h1 className="cart-page__title">¡Compra realizada!</h1>

                <div className="cart-success" role="status">
                    <p className="cart-success__text">
                        Registramos tu pedido. Es una compra simulada: no se
                        realizó ningún cobro.
                    </p>
                    <p className="cart-success__id">
                        Número de pedido: <strong>{orderId}</strong>
                    </p>
                    <Link to="/mis-pedidos" className="cart-success__link">
                        Ver mis pedidos
                    </Link>
                </div>
            </section>
        );
    }

    if (items.length === 0) {
        return (
            <section className="cart-page">
                <h1 className="cart-page__title">Carrito</h1>

                <EmptyState
                    icon={<CartIcon size={48} />}
                    title="Tu carrito está vacío"
                    action={
                        <Link to="/catalogo" className="cart-empty__link">
                            Explorar el catálogo
                        </Link>
                    }
                />
            </section>
        );
    }

    return (
        <section className="cart-page">
            <h1 className="cart-page__title">Carrito</h1>

            <div className="cart-page__layout">
                <ul className="cart-page__list">
                    {items.map((item) => (
                        <CartRow
                            key={item.product.id}
                            item={item}
                            locked={submitting}
                        />
                    ))}
                </ul>

                <aside className="cart-summary" aria-label="Resumen del carrito">
                    <h2 className="cart-summary__title">Resumen</h2>

                    <p className="cart-summary__row">
                        <span>
                            {itemCount}{" "}
                            {itemCount === 1 ? "producto" : "productos"}
                        </span>
                    </p>

                    <p className="cart-summary__total">
                        <span>Total</span>
                        <strong>{formatPrice(total)}</strong>
                    </p>

                    <p className="cart-summary__note">
                        Compra simulada: no se realiza ningún cobro.
                    </p>

                    {user ? (
                        <button
                            type="button"
                            className="cart-summary__checkout"
                            disabled={submitting}
                            aria-busy={submitting}
                            onClick={() => void handleConfirm()}
                        >
                            {submitting
                                ? "Procesando compra…"
                                : "Confirmar compra"}
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            state={{ returnTo: "/carrito" }}
                            className="cart-summary__checkout"
                        >
                            Iniciar sesión para comprar
                        </Link>
                    )}

                    {orderError && (
                        <p className="cart-summary__error" role="alert">
                            {orderError}
                        </p>
                    )}

                    <button
                        type="button"
                        className="cart-summary__clear"
                        disabled={submitting}
                        onClick={handleClear}
                    >
                        Vaciar carrito
                    </button>
                </aside>
            </div>
        </section>
    );
}

export default Cart;