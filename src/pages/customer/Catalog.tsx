import { useEffect, useState } from "react";
import type { JSX } from "react";
import { useSearchParams } from "react-router-dom";

import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import CategorySidebar from "../../components/products/CategorySidebar";
import ProductCard from "../../components/products/ProductCard";
import { getProductsPage } from "../../services/productService";
import type { ProductsCursor } from "../../services/productService";
import { CATEGORIES } from "../../types/product";
import type { CategoryId, Product } from "../../types/product";
import "./Catalog.css";

// Convierte el texto de la URL en una categoría válida (o null = "Todas").
// Si alguien escribe ?categoria=cualquiercosa, se ignora.
function parseCategory(value: string | null): CategoryId | null {
    return CATEGORIES.find((category) => category === value) ?? null;
}

interface CatalogResultsProps {
    categoryId: CategoryId | null;
}

// Lista paginada de libros. Catalog la monta con key={categoría}: al cambiar
// de categoría React crea una nueva y arranca de cero (spinner y primera página).
function CatalogResults({ categoryId }: CatalogResultsProps): JSX.Element {
    const [products, setProducts] = useState<Product[]>([]);
    const [nextCursor, setNextCursor] = useState<ProductsCursor | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [loadMoreError, setLoadMoreError] = useState("");

    useEffect(() => {
        async function loadFirstPage() {
            try {
                const page = await getProductsPage(null, categoryId);
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
    }, [categoryId]);

    async function handleLoadMore(): Promise<void> {
        if (!nextCursor) {
            return;
        }

        setLoadingMore(true);
        setLoadMoreError("");

        try {
            const page = await getProductsPage(nextCursor, categoryId);
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
        return <Spinner label="Cargando libros..." />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <>
            {products.length === 0 ? (
                <EmptyState
                    title={
                        categoryId
                            ? "No hay libros en esta categoría"
                            : "Todavía no hay libros disponibles"
                    }
                    description={
                        categoryId
                            ? "Probá con otra categoría."
                            : "Volvé a visitarnos pronto: estamos sumando títulos."
                    }
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
        </>
    );
}

function Catalog(): JSX.Element {
    const [searchParams] = useSearchParams();
    const categoryId = parseCategory(searchParams.get("categoria"));

    return (
        <section className="catalog">
            <h1 className="catalog__title">Catálogo</h1>

            <div className="catalog__layout">
                <CategorySidebar activeCategory={categoryId} />

                <div className="catalog__results">
                    <CatalogResults
                        key={categoryId ?? "todas"}
                        categoryId={categoryId}
                    />
                </div>
            </div>
        </section>
    );
}

export default Catalog;