import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    startAfter,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { db } from "./firebase";
import type { Product, ProductInput } from "../types/product";

// Cantidad de libros que muestra cada página del catálogo.
const PAGE_SIZE = 20;

// Marca "hasta acá llegué": es el último libro de la página anterior.
// Se exporta para que las pantallas la guarden sin importar Firebase.
export type ProductsCursor = QueryDocumentSnapshot<DocumentData>;

export interface ProductsPage {
    products: Product[];
    // null cuando ya no quedan más libros por cargar.
    nextCursor: ProductsCursor | null;
}

function toProduct(id: string, data: DocumentData): Product {
    const createdAt =
        data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(0);

    return {
        ...(data as Omit<Product, "id" | "createdAt">),
        id,
        createdAt,
    };
}

// Trae todo el catálogo. Lo usa el panel de administración.
export async function getProducts(): Promise<Product[]> {
    const productsRef = collection(db, "products");
    const productsQuery = query(productsRef, orderBy("title", "asc"));

    const snapshot = await getDocs(productsQuery);

    return snapshot.docs.map((document) =>
        toProduct(document.id, document.data())
    );
}

// Trae una página del catálogo. Sin cursor, devuelve la primera.
// Pide un libro de más (PAGE_SIZE + 1) solo para saber si hay otra página.
export async function getProductsPage(
    cursor: ProductsCursor | null = null
): Promise<ProductsPage> {
    const productsRef = collection(db, "products");

    const pageQuery = cursor
        ? query(
            productsRef,
            orderBy("title", "asc"),
            startAfter(cursor),
            limit(PAGE_SIZE + 1)
        )
        : query(productsRef, orderBy("title", "asc"), limit(PAGE_SIZE + 1));

    const snapshot = await getDocs(pageQuery);

    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const pageDocs = snapshot.docs.slice(0, PAGE_SIZE);

    return {
        products: pageDocs.map((document) =>
            toProduct(document.id, document.data())
        ),
        nextCursor: hasMore ? pageDocs[pageDocs.length - 1] : null,
    };
}

export async function getProductById(id: string): Promise<Product | null> {
    const productRef = doc(db, "products", id);
    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) {
        return null;
    }

    return toProduct(snapshot.id, snapshot.data());
}

// Crea un producto y devuelve el id que le asignó Firestore.
// createdAt lo pone el servidor, no el navegador.
export async function createProduct(input: ProductInput): Promise<string> {
    const productsRef = collection(db, "products");

    const created = await addDoc(productsRef, {
        ...input,
        createdAt: serverTimestamp(),
    });

    return created.id;
}

// Actualiza solo los campos del formulario. No toca createdAt.
export async function updateProduct(
    id: string,
    input: ProductInput
): Promise<void> {
    const productRef = doc(db, "products", id);

    await updateDoc(productRef, { ...input });
}

export async function deleteProduct(id: string): Promise<void> {
    const productRef = doc(db, "products", id);

    await deleteDoc(productRef);
}