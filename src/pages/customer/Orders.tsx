import { useEffect } from "react";
import type { JSX } from "react";

import ButtonLink from "../../components/common/ButtonLink";
import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import OrderCard from "../../components/orders/OrderCard";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useOrders } from "../../hooks/useOrders";
import "./Orders.css";

// La pantalla solo muestra: los pedidos los guarda OrderProvider y los
// pide a orderService. Acá queda únicamente qué dibujar en cada estado.
function Orders(): JSX.Element {
    const { loading: authLoading } = useAuthContext();
    const {
        userOrders,
        userOrdersLoading,
        userOrdersError,
        loadUserOrders,
    } = useOrders();

    useEffect(() => {
        loadUserOrders();
    }, [loadUserOrders]);

    const loading = authLoading || userOrdersLoading;
    const isEmpty = !loading && !userOrdersError && userOrders.length === 0;

    return (
        <section className="orders">
            <h1
                className={
                    isEmpty
                        ? "orders__title orders__title--centered"
                        : "orders__title"
                }
            >
                Mis pedidos
            </h1>

            {loading && <Spinner label="Cargando tus pedidos…" />}

            {!loading && userOrdersError && (
                <ErrorMessage message={userOrdersError} />
            )}

            {isEmpty && (
                <EmptyState
                    title="Todavía no hiciste ninguna compra"
                    description="Cuando compres un libro, vas a ver tu pedido acá."
                    action={
                        <ButtonLink to="/catalogo">Ver el catálogo</ButtonLink>
                    }
                />
            )}

            {!loading && !userOrdersError && userOrders.length > 0 && (
                <ul className="orders__list">
                    {userOrders.map((order) => (
                        <li key={order.id}>
                            <OrderCard order={order} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default Orders;