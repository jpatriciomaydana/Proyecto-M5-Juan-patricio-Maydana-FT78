import { useState } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";

import { useCart } from "../../hooks/useCart";
import type { Product } from "../../types/product";
import { formatPrice } from "../../utils/orders";
import AddToCartButton from "../cart/AddToCartButton";
import "./ProductCard.css";

interface ProductCardProps {
    product: Product;
}

function ProductCard({ product }: ProductCardProps): JSX.Element {
    const { getQuantity } = useCart();
    const [imageFailed, setImageFailed] = useState(false);

    const hasImage = product.imageUrl.trim() !== "" && !imageFailed;
    const outOfStock = product.stock <= 0;
    const inCart = getQuantity(product.id);

    return (
        <article
            className={`product-card ${outOfStock ? "product-card--out" : ""}`}
        >
            <div className="product-card__media">
                {hasImage ? (
                    <img
                        src={product.imageUrl}
                        alt={`Portada de ${product.title}`}
                        className="product-card__image"
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="product-card__placeholder" aria-hidden="true">
                        <span>{product.title}</span>
                    </div>
                )}

                {product.firstEdition && (
                    <span className="product-card__badge">Primera edición</span>
                )}
            </div>

            <div className="product-card__body">
                <h2 className="product-card__title">
                    <Link
                        to={`/catalogo/${product.id}`}
                        className="product-card__link"
                    >
                        {product.title}
                    </Link>
                </h2>
                <p className="product-card__author">{product.author}</p>
                <p className="product-card__category">{product.categoryId}</p>

                <div className="product-card__footer">
                    <p className="product-card__price">
                        {formatPrice(product.price)}
                    </p>
                    <p className="product-card__stock">
                        {outOfStock ? "Sin stock" : `Stock: ${product.stock}`}
                    </p>
                </div>

                {inCart > 0 && (
                    <p
                        className="mb-2 text-sm font-semibold text-forest"
                        role="status"
                    >
                        En tu carrito: {inCart}
                    </p>
                )}

                <AddToCartButton product={product} />
            </div>
        </article>
    );
}

export default ProductCard;