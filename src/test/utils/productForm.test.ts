import { describe, expect, it } from "vitest";

import {
    EMPTY_VALUES,
    getImageFileError,
    isHttpUrl,
    parseForm,
    toFormValues,
} from "../../utils/productForm";
import type { FormValues } from "../../utils/productForm";
import type { Product } from "../../types/product";

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: "p1",
        title: "Drácula",
        author: "Bram Stoker",
        description: "Novela de terror",
        price: 1000,
        categoryId: "Terror",
        stock: 5,
        imageUrl: "https://ejemplo.com/portada.jpg",
        isbn: "9780000000001",
        publisher: "Editorial de prueba",
        publicationYear: 1897,
        firstEdition: true,
        createdAt: new Date(0),
        ...overrides,
    };
}

function validValues(overrides: Partial<FormValues> = {}): FormValues {
    return {
        title: "Drácula",
        author: "Bram Stoker",
        description: "Novela de terror",
        price: "1000",
        categoryId: "Terror",
        stock: "5",
        imageUrl: "",
        isbn: "9780000000001",
        publisher: "Editorial de prueba",
        publicationYear: "1897",
        firstEdition: false,
        ...overrides,
    };
}

function makeFile(type: string, size: number): File {
    const file = new File(["x"], "portada", { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
}

describe("isHttpUrl", () => {
    it("acepta http y https", () => {
        expect(isHttpUrl("http://ejemplo.com")).toBe(true);
        expect(isHttpUrl("https://ejemplo.com/a.jpg")).toBe(true);
    });

    it("rechaza otros protocolos", () => {
        expect(isHttpUrl("ftp://ejemplo.com")).toBe(false);
        expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    });

    it("rechaza textos que no son una URL", () => {
        expect(isHttpUrl("no es una url")).toBe(false);
        expect(isHttpUrl("")).toBe(false);
    });
});

describe("toFormValues", () => {
    it("convierte los números a texto y copia el resto", () => {
        const result = toFormValues(makeProduct());

        expect(result).toEqual({
            title: "Drácula",
            author: "Bram Stoker",
            description: "Novela de terror",
            price: "1000",
            categoryId: "Terror",
            stock: "5",
            imageUrl: "https://ejemplo.com/portada.jpg",
            isbn: "9780000000001",
            publisher: "Editorial de prueba",
            publicationYear: "1897",
            firstEdition: true,
        });
    });
});

describe("parseForm", () => {
    it("con valores válidos devuelve el ProductInput convertido y sin errores", () => {
        const { errors, input } = parseForm(validValues());

        expect(errors).toEqual({});
        expect(input).toEqual({
            title: "Drácula",
            author: "Bram Stoker",
            description: "Novela de terror",
            price: 1000,
            categoryId: "Terror",
            stock: 5,
            imageUrl: "",
            isbn: "9780000000001",
            publisher: "Editorial de prueba",
            publicationYear: 1897,
            firstEdition: false,
        });
    });

    it("saca los espacios sobrantes de los textos", () => {
        const { input } = parseForm(
            validValues({ title: "  Drácula  ", author: " Bram Stoker " }),
        );

        expect(input?.title).toBe("Drácula");
        expect(input?.author).toBe("Bram Stoker");
    });

    it("con el formulario vacío devuelve todos los errores y ningún input", () => {
        const { errors, input } = parseForm(EMPTY_VALUES);

        expect(input).toBeNull();
        expect(Object.keys(errors).sort()).toEqual(
            [
                "author",
                "categoryId",
                "description",
                "isbn",
                "price",
                "publicationYear",
                "publisher",
                "stock",
                "title",
            ].sort(),
        );
    });

    it("pide el título, autor, descripción, editorial e ISBN si solo hay espacios", () => {
        const { errors } = parseForm(
            validValues({
                title: "  ",
                author: "  ",
                description: "  ",
                publisher: "  ",
                isbn: "  ",
            }),
        );

        expect(errors.title).toBe("Ingresá el título.");
        expect(errors.author).toBe("Ingresá el autor.");
        expect(errors.description).toBe("Ingresá una descripción.");
        expect(errors.publisher).toBe("Ingresá la editorial.");
        expect(errors.isbn).toBe("Ingresá el ISBN.");
    });

    it("rechaza una categoría que no existe", () => {
        const { errors, input } = parseForm(
            validValues({ categoryId: "Cocina" }),
        );

        expect(errors.categoryId).toBe("Elegí una categoría.");
        expect(input).toBeNull();
    });

    it("rechaza un precio vacío, cero, negativo o que no es número", () => {
        for (const price of ["", "0", "-5", "abc"]) {
            const { errors } = parseForm(validValues({ price }));

            expect(errors.price).toBe("Ingresá un precio mayor a 0.");
        }
    });

    it("acepta un precio con decimales", () => {
        const { errors, input } = parseForm(validValues({ price: "19.99" }));

        expect(errors.price).toBeUndefined();
        expect(input?.price).toBe(19.99);
    });

    it("rechaza un stock vacío, negativo, decimal o que no es número", () => {
        for (const stock of ["", "-1", "1.5", "abc"]) {
            const { errors } = parseForm(validValues({ stock }));

            expect(errors.stock).toBe("Ingresá un stock entero, de 0 o más.");
        }
    });

    it("acepta stock 0", () => {
        const { errors, input } = parseForm(validValues({ stock: "0" }));

        expect(errors.stock).toBeUndefined();
        expect(input?.stock).toBe(0);
    });

    it("rechaza un año vacío, decimal, que no es número o futuro", () => {
        const currentYear = new Date().getFullYear();

        for (const publicationYear of [
            "",
            "1990.5",
            "abc",
            String(currentYear + 1),
        ]) {
            const { errors } = parseForm(validValues({ publicationYear }));

            expect(errors.publicationYear).toBe(
                `Ingresá un año entero, hasta ${currentYear}.`,
            );
        }
    });

    it("acepta el año actual", () => {
        const currentYear = new Date().getFullYear();

        const { errors } = parseForm(
            validValues({ publicationYear: String(currentYear) }),
        );

        expect(errors.publicationYear).toBeUndefined();
    });

    it("acepta un año negativo (comportamiento actual: La Ilíada, -750)", () => {
        const { errors, input } = parseForm(
            validValues({ publicationYear: "-750" }),
        );

        expect(errors.publicationYear).toBeUndefined();
        expect(input?.publicationYear).toBe(-750);
    });

    it("la imagen es opcional", () => {
        const { errors, input } = parseForm(validValues({ imageUrl: "  " }));

        expect(errors.imageUrl).toBeUndefined();
        expect(input?.imageUrl).toBe("");
    });

    it("acepta una URL de imagen http o https", () => {
        const { errors, input } = parseForm(
            validValues({ imageUrl: " https://ejemplo.com/a.jpg " }),
        );

        expect(errors.imageUrl).toBeUndefined();
        expect(input?.imageUrl).toBe("https://ejemplo.com/a.jpg");
    });

    it("rechaza una URL de imagen inválida", () => {
        const { errors, input } = parseForm(
            validValues({ imageUrl: "portada.jpg" }),
        );

        expect(errors.imageUrl).toBe(
            "Ingresá una URL válida que empiece con http:// o https://.",
        );
        expect(input).toBeNull();
    });

    it("conserva firstEdition", () => {
        const { input } = parseForm(validValues({ firstEdition: true }));

        expect(input?.firstEdition).toBe(true);
    });
});

describe("getImageFileError", () => {
    it("acepta JPG, PNG y WebP de hasta 5 MB", () => {
        expect(getImageFileError(makeFile("image/jpeg", 1000))).toBeNull();
        expect(getImageFileError(makeFile("image/png", 1000))).toBeNull();
        expect(getImageFileError(makeFile("image/webp", 1000))).toBeNull();
    });

    it("acepta un archivo de exactamente 5 MB", () => {
        expect(
            getImageFileError(makeFile("image/png", 5 * 1024 * 1024)),
        ).toBeNull();
    });

    it("rechaza un tipo de archivo no permitido", () => {
        expect(getImageFileError(makeFile("application/pdf", 1000))).toBe(
            "Tipo de archivo no permitido. Usá JPG, PNG o WebP.",
        );
        expect(getImageFileError(makeFile("image/gif", 1000))).toBe(
            "Tipo de archivo no permitido. Usá JPG, PNG o WebP.",
        );
    });

    it("rechaza un archivo de más de 5 MB", () => {
        expect(
            getImageFileError(makeFile("image/png", 5 * 1024 * 1024 + 1)),
        ).toBe("La imagen pesa más de 5 MB. Elegí una más liviana.");
    });
});