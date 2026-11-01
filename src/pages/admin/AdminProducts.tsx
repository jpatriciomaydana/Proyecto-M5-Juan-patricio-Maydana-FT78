import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import { deleteProduct, getProducts } from "../../services/productService";
import type { Product } from "../../types/product";
import "./AdminProducts.css";

const priceFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
});

function getDeleteErrorMessage(error: unknown): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "permission-denied"
    ) {
        return "No tenés permisos para eliminar productos. Verificá que tu cuenta sea de administrador.";
    }

    return "No pudimos eliminar el producto. Intentá de nuevo en unos minutos.";
}

function AdminProducts(): JSX.Element {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fila que está pidiendo confirmación y fila que se está borrando.
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        getProducts()
            .then((data) => {
                if (!cancelled) {
                    setProducts(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(
                        "No pudimos cargar los productos. Intentá de nuevo en unos minutos."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        // Si el usuario sale de la página antes de que responda Firestore,
        // evitamos actualizar el estado de un componente que ya no existe.
        return () => {
            cancelled = true;
        };
    }, []);

    function askConfirmation(productId: string): void {
        setDeleteError(null);
        setConfirmingId(productId);
    }

    async function handleDelete(product: Product): Promise<void> {
        setDeleteError(null);
        setDeletingId(product.id);

        try {
            await deleteProduct(product.id);

            // Firestore ya confirmó: recién ahora sacamos la fila de la pantalla.
            setProducts((previous) =>
                previous.filter((item) => item.id !== product.id)
            );
        } catch (caught) {
            setDeleteError(getDeleteErrorMessage(caught));
        } finally {
            setDeletingId(null);
            setConfirmingId(null);
        }
    }

    const hasProducts = !loading && !error && products.length > 0;
    const isEmpty = !loading && !error && products.length === 0;

    return (
        <section className="admin-products">
            <div className="admin-products__header">
                <h1 className="admin-products__title">Productos</h1>

                <Link
                    to="/admin/productos/nuevo"
                    className="admin-products__new"
                >
                    Nuevo producto
                </Link>
            </div>

            {loading && <Spinner label="Cargando productos..." />}

            {error && <ErrorMessage message={error} />}

            {deleteError && <ErrorMessage message={deleteError} />}

            {isEmpty && (
                <EmptyState
                    title="Todavía no hay productos cargados"
                    description='Usá el botón "Nuevo producto" para cargar el primero.'
                />
            )}

            {hasProducts && (
                <>
                    <p className="admin-products__count">
                        {products.length}{" "}
                        {products.length === 1 ? "producto" : "productos"}
                    </p>

                    <table
                        className="admin-products__table"
                        aria-label="Listado de productos"
                    >
                        <thead>
                            <tr>
                                <th scope="col">Título</th>
                                <th scope="col">Categoría</th>
                                <th scope="col">Precio</th>
                                <th scope="col">Stock</th>
                                <th scope="col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const isConfirming = confirmingId === product.id;
                                const isDeleting = deletingId === product.id;

                                return (
                                    <tr key={product.id}>
                                        <td className="admin-products__cell-title">
                                            <span className="admin-products__book-title">
                                                {product.title}
                                            </span>
                                            <span className="admin-products__book-author">
                                                {product.author}
                                            </span>
                                        </td>
                                        <td data-label="Categoría">
                                            {product.categoryId}
                                        </td>
                                        <td data-label="Precio">
                                            {priceFormatter.format(product.price)}
                                        </td>
                                        <td data-label="Stock">
                                            {product.stock > 0 ? (
                                                product.stock
                                            ) : (
                                                <span className="admin-products__stock--empty">
                                                    Sin stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="admin-products__cell-actions">
                                            {isConfirming ? (
                                                <div
                                                    className="admin-products__confirm"
                                                    role="group"
                                                    aria-label={`Confirmar eliminación de ${product.title}`}
                                                >
                                                    <p className="admin-products__confirm-text">
                                                        ¿Eliminar «{product.title}»?
                                                        No se puede deshacer.
                                                    </p>
                                                    <div className="admin-products__actions">
                                                        <button
                                                            type="button"
                                                            className="admin-products__confirm-yes"
                                                            onClick={() =>
                                                                void handleDelete(product)
                                                            }
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting
                                                                ? "Eliminando..."
                                                                : "Sí, eliminar"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="admin-products__confirm-no"
                                                            onClick={() =>
                                                                setConfirmingId(null)
                                                            }
                                                            disabled={isDeleting}
                                                            autoFocus
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="admin-products__actions">
                                                    <Link
                                                        to={`/admin/productos/${product.id}/editar`}
                                                        className="admin-products__edit"
                                                        aria-label={`Editar ${product.title}`}
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="admin-products__delete"
                                                        aria-label={`Eliminar ${product.title}`}
                                                        onClick={() =>
                                                            askConfirmation(product.id)
                                                        }
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}
        </section>
    );
}

export default AdminProducts;