import { useEffect, useState } from "react";
import type { JSX } from "react";

import ButtonLink from "../../components/common/ButtonLink";
import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import OrderCard from "../../components/orders/OrderCard";
import { useAuthContext } from "../../hooks/useAuthContext";
import { getUserOrders } from "../../services/orderService";
import type { Order } from "../../types/order";
import "./Orders.css";

// Guardamos junto a los pedidos el uid al que pertenecen. Así "cargando" se
// calcula comparando uids y no hace falta llamar a setState dentro del efecto.
interface OrdersState {
    uid: string;
    orders: Order[];
    failed: boolean;
}

function Orders(): JSX.Element {
    const { user, loading: authLoading } = useAuthContext();
    const [state, setState] = useState<OrdersState | null>(null);

    const uid = user?.uid ?? null;

    useEffect(() => {
        if (!uid) {
            return undefined;
        }

        let cancelled = false;

        getUserOrders(uid)
            .then((orders) => {
                if (!cancelled) {
                    setState({ uid, orders, failed: false });
                }
            })
            .catch((error: unknown) => {
                console.error("No se pudieron cargar los pedidos:", error);
                if (!cancelled) {
                    setState({ uid, orders: [], failed: true });
                }
            });

        // Si el componente se desmonta antes de que responda Firestore,
        // se ignora el resultado.
        return () => {
            cancelled = true;
        };
    }, [uid]);

    const loading = authLoading || (uid !== null && state?.uid !== uid);

    if (loading) {
        return (
            <section className="orders">
                <h1 className="orders__title">Mis pedidos</h1>
                <Spinner label="Cargando tus pedidos…" />
            </section>
        );
    }

    if (state?.failed) {
        return (
            <section className="orders">
                <h1 className="orders__title">Mis pedidos</h1>
                <ErrorMessage message="No pudimos cargar tus pedidos. Intentá de nuevo en unos minutos." />
            </section>
        );
    }

    const orders = state?.orders ?? [];

    if (orders.length === 0) {
        return (
            <section className="orders">
                <h1 className="orders__title">Mis pedidos</h1>
                <EmptyState
                    title="Todavía no hiciste ninguna compra"
                    description="Cuando compres un libro, vas a ver tu pedido acá."
                    action={
                        <ButtonLink to="/catalogo">Ver el catálogo</ButtonLink>
                    }
                />
            </section>
        );
    }

    return (
        <section className="orders">
            <h1 className="orders__title">Mis pedidos</h1>

            <ul className="orders__list">
                {orders.map((order) => (
                    <li key={order.id}>
                        <OrderCard order={order} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default Orders;