import { CATEGORIES } from "../types/product";
import type { CategoryId, Product, ProductInput } from "../types/product";

// Límites de la imagen. Se controlan solo en el navegador (deuda 38).
const ALLOWED_IMAGE_TYPES: string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Mientras se escribe, todo es texto. Se convierte a número al validar.
export interface FormValues {
    title: string;
    author: string;
    description: string;
    price: string;
    categoryId: string;
    stock: string;
    imageUrl: string;
    isbn: string;
    publisher: string;
    publicationYear: string;
    firstEdition: boolean;
}

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export const EMPTY_VALUES: FormValues = {
    title: "",
    author: "",
    description: "",
    price: "",
    categoryId: "",
    stock: "",
    imageUrl: "",
    isbn: "",
    publisher: "",
    publicationYear: "",
    firstEdition: false,
};

function isCategoryId(value: string): value is CategoryId {
    return CATEGORIES.some((category) => category === value);
}

export function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export function toFormValues(product: Product): FormValues {
    return {
        title: product.title,
        author: product.author,
        description: product.description,
        price: String(product.price),
        categoryId: product.categoryId,
        stock: String(product.stock),
        imageUrl: product.imageUrl,
        isbn: product.isbn,
        publisher: product.publisher,
        publicationYear: String(product.publicationYear),
        firstEdition: product.firstEdition,
    };
}

// Valida los textos del formulario. Si todo está bien, devuelve el
// ProductInput ya convertido (números reales, textos sin espacios sobrantes).
export function parseForm(values: FormValues): {
    errors: FormErrors;
    input: ProductInput | null;
} {
    const errors: FormErrors = {};

    const title = values.title.trim();
    const author = values.author.trim();
    const description = values.description.trim();
    const publisher = values.publisher.trim();
    const isbn = values.isbn.trim();
    const imageUrl = values.imageUrl.trim();
    const categoryId = values.categoryId;

    const price = Number(values.price);
    const stock = Number(values.stock);
    const publicationYear = Number(values.publicationYear);
    const currentYear = new Date().getFullYear();

    if (!title) errors.title = "Ingresá el título.";
    if (!author) errors.author = "Ingresá el autor.";
    if (!description) errors.description = "Ingresá una descripción.";
    if (!publisher) errors.publisher = "Ingresá la editorial.";
    if (!isbn) errors.isbn = "Ingresá el ISBN.";

    if (!isCategoryId(categoryId)) {
        errors.categoryId = "Elegí una categoría.";
    }

    if (values.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
        errors.price = "Ingresá un precio mayor a 0.";
    }

    if (values.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) {
        errors.stock = "Ingresá un stock entero, de 0 o más.";
    }

    if (
        values.publicationYear.trim() === "" ||
        !Number.isInteger(publicationYear) ||
        publicationYear > currentYear
    ) {
        errors.publicationYear = `Ingresá un año entero, hasta ${currentYear}.`;
    }

    if (imageUrl !== "" && !isHttpUrl(imageUrl)) {
        errors.imageUrl =
            "Ingresá una URL válida que empiece con http:// o https://.";
    }

    if (Object.keys(errors).length > 0 || !isCategoryId(categoryId)) {
        return { errors, input: null };
    }

    return {
        errors,
        input: {
            title,
            author,
            description,
            price,
            categoryId,
            stock,
            imageUrl,
            isbn,
            publisher,
            publicationYear,
            firstEdition: values.firstEdition,
        },
    };
}

// Devuelve el motivo por el que un archivo no se puede subir, o null si sirve.
export function getImageFileError(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return "Tipo de archivo no permitido. Usá JPG, PNG o WebP.";
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return "La imagen pesa más de 5 MB. Elegí una más liviana.";
    }

    return null;
}