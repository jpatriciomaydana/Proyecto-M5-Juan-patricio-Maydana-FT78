import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Link, useParams } from "react-router-dom";

import { useCart } from "../../hooks/useCart";
import { useProducts } from "../../hooks/useProducts";
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
    const {
        selectedProduct,
        selectedProductLoading: loading,
        selectedProductError: error,
        loadProductById,
    } = useProducts();

    const [imageFailed, setImageFailed] = useState(false);

    // La pantalla pide el libro al montarse; el Provider decide cómo.
    useEffect(() => {
        if (id) {
            loadProductById(id);
        }
    }, [id, loadProductById]);

    // Solo se muestra el libro si es el de la URL: durante un instante el
    // contexto puede tener todavía el libro anterior.
    const product =
        selectedProduct !== null && selectedProduct.id === id
            ? selectedProduct
            : null;

    if (id && loading) {
        return (
            <section className="detail">
                <Spinner label="Cargando libro..." />
            </section>
        );
    }

    if (id && error) {
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