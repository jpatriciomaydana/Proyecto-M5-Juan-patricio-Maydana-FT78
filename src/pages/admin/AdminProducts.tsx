import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, JSX } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import { useDebounce } from "../../hooks/useDebounce";
import { useProducts } from "../../hooks/useProducts";
import type { Product } from "../../types/product";
import { formatPrice } from "../../utils/orders";
import { normalizeText } from "../../utils/text";
import "./AdminProducts.css";

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
    // La lista, la carga y el borrado vienen del contexto. Esta pantalla no
    // habla con Firebase: el Provider es quien llama al servicio.
    const { products, loading, error, loadProducts, removeProduct } =
        useProducts();

    // Texto del buscador. Solo lo usa esta pantalla, por eso es estado local.
    const [searchText, setSearchText] = useState<string>("");
    const debouncedSearch = useDebounce(searchText, 300);

    // Fila que está pidiendo confirmación y fila que se está borrando.
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Empieza a escuchar el catálogo completo (una sola vez, es perezoso).
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const term = normalizeText(debouncedSearch);

    const results = useMemo(() => {
        if (!term) {
            return products;
        }

        return products.filter(
            (product) =>
                normalizeText(product.title).includes(term) ||
                normalizeText(product.author).includes(term)
        );
    }, [products, term]);

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
        setSearchText(event.target.value);
    }

    function askConfirmation(productId: string): void {
        setDeleteError(null);
        setConfirmingId(productId);
    }

    async function handleDelete(product: Product): Promise<void> {
        setDeleteError(null);
        setDeletingId(product.id);

        try {
            // El Provider borra en Firestore. La fila desaparece sola cuando
            // Firestore avisa el cambio (onSnapshot): no se saca a mano.
            await removeProduct(product.id);
        } catch (caught) {
            setDeleteError(getDeleteErrorMessage(caught));
        } finally {
            setDeletingId(null);
            setConfirmingId(null);
        }
    }

    const hasProducts = !loading && !error && products.length > 0;
    const isEmpty = !loading && !error && products.length === 0;
    const noMatches = hasProducts && results.length === 0;

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

            {hasProducts && (
                <div className="admin-products__search">
                    <label
                        htmlFor="admin-product-search"
                        className="admin-products__search-label"
                    >
                        Buscar productos por título o autor
                    </label>
                    <input
                        id="admin-product-search"
                        type="search"
                        value={searchText}
                        onChange={handleSearchChange}
                        placeholder="Buscar por título o autor"
                        autoComplete="off"
                        className="admin-products__search-input"
                    />
                </div>
            )}

            {loading && <Spinner label="Cargando productos..." />}

            {error && <ErrorMessage message={error} />}

            {deleteError && <ErrorMessage message={deleteError} />}

            {isEmpty && (
                <EmptyState
                    title="Todavía no hay productos cargados"
                    description='Usá el botón "Nuevo producto" para cargar el primero.'
                />
            )}

            {noMatches && (
                <EmptyState
                    title="No encontramos productos"
                    description="Probá con otro título o autor."
                />
            )}

            {hasProducts && !noMatches && (
                <>
                    <p className="admin-products__count" aria-live="polite">
                        {term
                            ? `${results.length} de ${products.length} productos`
                            : `${products.length} ${products.length === 1
                                ? "producto"
                                : "productos"
                            }`}
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
                            {results.map((product) => {
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
                                            {formatPrice(product.price)}
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