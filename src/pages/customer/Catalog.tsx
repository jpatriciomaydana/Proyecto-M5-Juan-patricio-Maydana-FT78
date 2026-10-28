import { useEffect, useState } from "react";
import type { JSX } from "react";

import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import ProductCard from "../../components/products/ProductCard";
import { getProductsPage } from "../../services/productService";
import type { ProductsCursor } from "../../services/productService";
import type { Product } from "../../types/product";
import "./Catalog.css";

function Catalog(): JSX.Element {
    const [products, setProducts] = useState<Product[]>([]);
    const [nextCursor, setNextCursor] = useState<ProductsCursor | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [loadMoreError, setLoadMoreError] = useState("");

    useEffect(() => {
        async function loadFirstPage() {
            try {
                const page = await getProductsPage();
                setProducts(page.products);
                setNextCursor(page.nextCursor);
            } catch (error) {
                console.error("Error al cargar los productos:", error);
                setError("No pudimos cargar los libros. Intentá nuevamente.");
            } finally {
                setLoading(false);
            }
        }

        loadFirstPage();
    }, []);

    async function handleLoadMore(): Promise<void> {
        if (!nextCursor) {
            return;
        }

        setLoadingMore(true);
        setLoadMoreError("");

        try {
            const page = await getProductsPage(nextCursor);
            setProducts((current) => [...current, ...page.products]);
            setNextCursor(page.nextCursor);
        } catch (error) {
            console.error("Error al cargar más productos:", error);
            setLoadMoreError(
                "No pudimos cargar más libros. Intentá nuevamente."
            );
        } finally {
            setLoadingMore(false);
        }
    }

    if (loading) {
        return (
            <section className="catalog">
                <h1 className="catalog__title">Catálogo</h1>
                <Spinner label="Cargando libros..." />
            </section>
        );
    }

    if (error) {
        return (
            <section className="catalog">
                <h1 className="catalog__title">Catálogo</h1>
                <ErrorMessage message={error} />
            </section>
        );
    }

    return (
        <section className="catalog">
            <h1 className="catalog__title">Catálogo</h1>

            {products.length === 0 ? (
                <EmptyState
                    title="Todavía no hay libros disponibles"
                    description="Volvé a visitarnos pronto: estamos sumando títulos."
                />
            ) : (
                <ul className="catalog__grid">
                    {products.map((product) => (
                        <li key={product.id}>
                            <ProductCard product={product} />
                        </li>
                    ))}
                </ul>
            )}

            {loadMoreError && <ErrorMessage message={loadMoreError} />}

            {nextCursor && (
                <div className="catalog__more">
                    <button
                        type="button"
                        className="catalog__more-button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Cargando..." : "Ver más libros"}
                    </button>
                </div>
            )}
        </section>
    );
}

export default Catalog;