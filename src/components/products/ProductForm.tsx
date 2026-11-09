import { useState } from "react";
import type { ChangeEvent, FormEvent, JSX, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useProducts } from "../../hooks/useProducts";
import { CATEGORIES } from "../../types/product";
import {
    getImageFileError,
    isHttpUrl,
    parseForm,
} from "../../utils/productForm";
import type { FormErrors, FormValues } from "../../utils/productForm";
import "./ProductForm.css";

function getSaveErrorMessage(error: unknown): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "permission-denied"
    ) {
        return "No tenés permisos para guardar productos. Verificá que tu cuenta sea de administrador.";
    }

    return "No pudimos guardar el producto. Intentá de nuevo en unos minutos.";
}

interface FieldProps {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}

function Field({ id, label, error, children }: FieldProps): JSX.Element {
    return (
        <div className="product-form__field">
            <label htmlFor={id} className="product-form__label">
                {label}
            </label>
            {children}
            {error && (
                <p id={`${id}-error`} className="product-form__error">
                    {error}
                </p>
            )}
        </div>
    );
}

interface ProductFormProps {
    // Si viene, se está editando ese libro; si no, se está creando uno.
    productId?: string;
    // Valores con los que arranca el formulario (vacíos al crear, los del
    // libro ya cargado al editar).
    initialValues: FormValues;
}

// El formulario en sí. Solo se monta cuando ya están los valores iniciales,
// así que no hace falta rellenarlo desde un efecto.
function ProductForm({
    productId,
    initialValues,
}: ProductFormProps): JSX.Element {
    const navigate = useNavigate();
    const isEditing = productId !== undefined;

    // Crear, editar y subir la imagen pasan por el contexto: es el que habla
    // con los servicios.
    const { addProduct, editProduct, uploadImage } = useProducts();

    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    // URL cuya imagen no se pudo mostrar. Si la URL cambia, deja de coincidir
    // y la vista previa se intenta de nuevo.
    const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(
        null
    );

    function handleChange(
        event: ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ): void {
        const { name, value } = event.target;

        setValues((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: undefined }));
    }

    function handleCheckbox(event: ChangeEvent<HTMLInputElement>): void {
        const { checked } = event.target;

        setValues((previous) => ({ ...previous, firstEdition: checked }));
    }

    async function handleImageChange(
        event: ChangeEvent<HTMLInputElement>
    ): Promise<void> {
        const input = event.target;
        const file = input.files?.[0];

        // Se limpia el selector para poder elegir de nuevo el mismo archivo.
        input.value = "";

        if (!file) {
            return;
        }

        setUploadError(null);

        const fileError = getImageFileError(file);

        if (fileError) {
            setUploadError(fileError);
            return;
        }

        setUploading(true);

        try {
            const publicUrl = await uploadImage(file);

            setValues((previous) => ({ ...previous, imageUrl: publicUrl }));
            setErrors((previous) => ({ ...previous, imageUrl: undefined }));
        } catch (error) {
            setUploadError(
                error instanceof Error
                    ? error.message
                    : "No pudimos subir la imagen. Intentá de nuevo."
            );
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        if (uploading) {
            return;
        }

        setSubmitError(null);

        const { errors: foundErrors, input } = parseForm(values);
        setErrors(foundErrors);

        if (!input) {
            return;
        }

        setSaving(true);

        try {
            if (productId) {
                await editProduct(productId, input);
            } else {
                await addProduct(input);
            }

            navigate("/admin/productos");
        } catch (error) {
            setSubmitError(getSaveErrorMessage(error));
            setSaving(false);
        }
    }

    // Atributos de accesibilidad para marcar un campo con error.
    function fieldProps(name: keyof FormValues): {
        "aria-invalid"?: true;
        "aria-describedby"?: string;
    } {
        return errors[name]
            ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
            : {};
    }

    const previewUrl = values.imageUrl.trim();
    const hasPreview = previewUrl !== "" && isHttpUrl(previewUrl);
    const previewFailed = hasPreview && previewUrl === failedPreviewUrl;

    return (
        <section className="product-form">
            <h1 className="product-form__title">
                {isEditing ? "Editar producto" : "Nuevo producto"}
            </h1>

            <form className="product-form__form" onSubmit={handleSubmit} noValidate>
                <Field id="title" label="Título" error={errors.title}>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        className="product-form__input"
                        value={values.title}
                        onChange={handleChange}
                        autoComplete="off"
                        {...fieldProps("title")}
                    />
                </Field>

                <Field id="author" label="Autor" error={errors.author}>
                    <input
                        id="author"
                        name="author"
                        type="text"
                        className="product-form__input"
                        value={values.author}
                        onChange={handleChange}
                        autoComplete="off"
                        {...fieldProps("author")}
                    />
                </Field>

                <Field
                    id="description"
                    label="Descripción"
                    error={errors.description}
                >
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        className="product-form__input product-form__textarea"
                        value={values.description}
                        onChange={handleChange}
                        {...fieldProps("description")}
                    />
                </Field>

                <Field id="categoryId" label="Categoría" error={errors.categoryId}>
                    <select
                        id="categoryId"
                        name="categoryId"
                        className="product-form__input"
                        value={values.categoryId}
                        onChange={handleChange}
                        {...fieldProps("categoryId")}
                    >
                        <option value="">Elegí una categoría</option>
                        {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </Field>

                <div className="product-form__row">
                    <Field id="price" label="Precio (ARS)" error={errors.price}>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            step="any"
                            inputMode="decimal"
                            className="product-form__input"
                            value={values.price}
                            onChange={handleChange}
                            {...fieldProps("price")}
                        />
                    </Field>

                    <Field id="stock" label="Stock" error={errors.stock}>
                        <input
                            id="stock"
                            name="stock"
                            type="number"
                            step="1"
                            inputMode="numeric"
                            className="product-form__input"
                            value={values.stock}
                            onChange={handleChange}
                            {...fieldProps("stock")}
                        />
                    </Field>
                </div>

                <div className="product-form__row">
                    <Field id="isbn" label="ISBN" error={errors.isbn}>
                        <input
                            id="isbn"
                            name="isbn"
                            type="text"
                            className="product-form__input"
                            value={values.isbn}
                            onChange={handleChange}
                            autoComplete="off"
                            {...fieldProps("isbn")}
                        />
                    </Field>

                    <Field
                        id="publicationYear"
                        label="Año de publicación"
                        error={errors.publicationYear}
                    >
                        <input
                            id="publicationYear"
                            name="publicationYear"
                            type="number"
                            step="1"
                            inputMode="numeric"
                            className="product-form__input"
                            value={values.publicationYear}
                            onChange={handleChange}
                            {...fieldProps("publicationYear")}
                        />
                    </Field>
                </div>

                <Field id="publisher" label="Editorial" error={errors.publisher}>
                    <input
                        id="publisher"
                        name="publisher"
                        type="text"
                        className="product-form__input"
                        value={values.publisher}
                        onChange={handleChange}
                        autoComplete="off"
                        {...fieldProps("publisher")}
                    />
                </Field>

                <Field
                    id="imageFile"
                    label="Subir imagen (JPG, PNG o WebP, hasta 5 MB)"
                >
                    <input
                        id="imageFile"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="product-form__file"
                        onChange={handleImageChange}
                        disabled={uploading}
                    />
                    {uploading && (
                        <p className="product-form__image-status" role="status">
                            Subiendo imagen...
                        </p>
                    )}
                    {uploadError && (
                        <p className="product-form__image-error" role="alert">
                            {uploadError}
                        </p>
                    )}
                </Field>

                {hasPreview && !previewFailed && (
                    <div className="product-form__image-preview">
                        <img
                            src={previewUrl}
                            alt="Vista previa de la imagen del producto"
                            className="product-form__image"
                            onError={() => setFailedPreviewUrl(previewUrl)}
                        />
                    </div>
                )}

                {previewFailed && (
                    <p className="product-form__image-error" role="alert">
                        No pudimos mostrar la imagen de esa URL. Revisala o subí
                        otra.
                    </p>
                )}

                <Field
                    id="imageUrl"
                    label="URL de la imagen (opcional)"
                    error={errors.imageUrl}
                >
                    <input
                        id="imageUrl"
                        name="imageUrl"
                        type="text"
                        inputMode="url"
                        className="product-form__input"
                        value={values.imageUrl}
                        onChange={handleChange}
                        autoComplete="off"
                        {...fieldProps("imageUrl")}
                    />
                </Field>

                <label className="product-form__checkbox">
                    <input
                        type="checkbox"
                        name="firstEdition"
                        checked={values.firstEdition}
                        onChange={handleCheckbox}
                    />
                    Primera edición
                </label>

                {submitError && (
                    <p className="product-form__submit-error" role="alert">
                        {submitError}
                    </p>
                )}

                <div className="product-form__actions">
                    <button
                        type="submit"
                        className="product-form__button"
                        disabled={saving || uploading}
                    >
                        {saving
                            ? "Guardando..."
                            : isEditing
                                ? "Guardar cambios"
                                : "Crear producto"}
                    </button>

                    <Link to="/admin/productos" className="product-form__cancel">
                        Cancelar
                    </Link>
                </div>
            </form>
        </section>
    );
}

export default ProductForm;