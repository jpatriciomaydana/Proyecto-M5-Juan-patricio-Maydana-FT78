import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Link, useParams } from "react-router-dom";

import { useCart } from "../../hooks/useCart";
import { getProductById } from "../../services/productService";
import type { Product } from "../../types/product";
import { formatPrice } from "../../utils/orders";
import AddToCartButton from "../../components/cart/AddToCartButton";
import ButtonLink from "../../components/common/ButtonLink";
import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Spinner from "../../components/common/Spinner";
import "./ProductDetail.css";

function ProductDetail(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const { getQuantity } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadProduct(): Promise<void> {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const result = await getProductById(id);
                if (!cancelled) {
                    setProduct(result);
                }
            } catch (err) {
                console.error("Error al cargar el producto:", err);
                if (!cancelled) {
                    setError("No pudimos cargar el libro. Intentá nuevamente.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <section className="detail">
                <Spinner label="Cargando libro..." />
            </section>
        );
    }

    if (error) {
        return (
            <section className="detail">
                <ErrorMessage message={error} />
                <div className="mt-4 text-center">
                    <ButtonLink to="/catalogo">Volver al catálogo</ButtonLink>
                </div>
            </section>
        );
    }

    if (!product) {
        return (
            <section className="detail">
                <EmptyState
                    title="Libro no encontrado"
                    description="Es posible que el libro ya no esté disponible."
                    action={
                        <ButtonLink to="/catalogo">
                            Volver al catálogo
                        </ButtonLink>
                    }
                />
            </section>
        );
    }

    const hasImage = product.imageUrl.trim() !== "" && !imageFailed;
    const outOfStock = product.stock <= 0;
    const inCart = getQuantity(product.id);

    return (
        <section className="detail">
            <Link to="/catalogo" className="detail__back">
                ← Volver al catálogo
            </Link>

            <div className="detail__layout">
                <div className="detail__media">
                    {hasImage ? (
                        <img
                            src={product.imageUrl}
                            alt={`Portada de ${product.title}`}
                            className="detail__image"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <div className="detail__placeholder" aria-hidden="true">
                            <span>{product.title}</span>
                        </div>
                    )}
                </div>

                <div className="detail__info">
                    <p className="detail__category">{product.categoryId}</p>
                    <h1 className="detail__title">{product.title}</h1>
                    <p className="detail__author">{product.author}</p>

                    {product.firstEdition && (
                        <p className="detail__badge">Primera edición</p>
                    )}

                    <p className="detail__price">
                        {formatPrice(product.price)}
                    </p>
                    <p className="detail__stock">
                        {outOfStock
                            ? "Sin stock"
                            : `Stock disponible: ${product.stock}`}
                    </p>

                    {inCart > 0 && (
                        <p
                            className="mb-2 text-sm font-semibold text-forest"
                            role="status"
                        >
                            En tu carrito: {inCart}
                        </p>
                    )}

                    <AddToCartButton product={product} />

                    <p className="detail__description">{product.description}</p>

                    <dl className="detail__data">
                        <dt>ISBN</dt>
                        <dd>{product.isbn}</dd>
                        <dt>Editorial</dt>
                        <dd>{product.publisher}</dd>
                        <dt>Año de publicación</dt>
                        <dd>{product.publicationYear}</dd>
                    </dl>
                </div>
            </div>
        </section>
    );
}

export default ProductDetail;