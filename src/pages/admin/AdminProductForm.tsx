import { useEffect } from "react";
import type { JSX } from "react";
import { Link, useParams } from "react-router-dom";

import ProductForm from "../../components/products/ProductForm";
import { useProducts } from "../../hooks/useProducts";
import { EMPTY_VALUES, toFormValues } from "../../utils/productForm";
import "../../components/products/ProductForm.css";

const NOT_FOUND_MESSAGE = "No encontramos el producto que querés editar.";

// La pantalla pide el libro (si se está editando) y decide qué mostrar:
// carga, error o el formulario. El Provider es quien habla con el servicio.
function AdminProductForm(): JSX.Element {
    const { id } = useParams();
    const {
        selectedProduct,
        selectedProductLoading,
        selectedProductError,
        loadProductById,
    } = useProducts();

    // Solo en modo edición: pide el libro al montarse.
    useEffect(() => {
        if (id) {
            loadProductById(id);
        }
    }, [id, loadProductById]);

    // Crear: formulario vacío, no hay nada que cargar.
    if (id === undefined) {
        return <ProductForm initialValues={EMPTY_VALUES} />;
    }

    if (selectedProductLoading) {
        return (
            <section className="product-form">
                <p className="product-form__message" role="status">
                    Cargando producto...
                </p>
            </section>
        );
    }

    // Solo se usa el libro si es el de la URL: durante un instante el
    // contexto puede tener todavía otro.
    if (
        selectedProductError ||
        selectedProduct === null ||
        selectedProduct.id !== id
    ) {
        return (
            <section className="product-form">
                <p
                    className="product-form__message product-form__message--error"
                    role="alert"
                >
                    {selectedProductError ?? NOT_FOUND_MESSAGE}
                </p>
                <Link to="/admin/productos" className="product-form__link">
                    Volver al listado
                </Link>
            </section>
        );
    }

    return (
        <ProductForm
            key={id}
            productId={id}
            initialValues={toFormValues(selectedProduct)}
        />
    );
}

export default AdminProductForm;