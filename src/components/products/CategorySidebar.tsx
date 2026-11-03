import type { JSX } from "react";
import { Link } from "react-router-dom";

import { CATEGORIES } from "../../types/product";
import type { CategoryId } from "../../types/product";

interface CategorySidebarProps {
    // null significa "Todas".
    activeCategory: CategoryId | null;
}

// Clases compartidas por todos los enlaces. En celular son botones en fila;
// desde 1024 px son filas de una columna con una marca a la izquierda.
const BASE_CLASSES =
    "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded border px-4 text-base " +
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold " +
    "lg:rounded-none lg:border-0 lg:border-l-4 lg:px-3";

const ACTIVE_CLASSES = "border-gold-dark font-bold text-gold-dark";
const INACTIVE_CLASSES =
    "border-line text-ink hover:border-forest lg:border-transparent";

function CategorySidebar({ activeCategory }: CategorySidebarProps): JSX.Element {
    return (
        <nav
            aria-label="Categorías"
            className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
        >
            <Link
                to="/catalogo"
                aria-current={activeCategory === null ? "page" : undefined}
                className={`${BASE_CLASSES} ${activeCategory === null ? ACTIVE_CLASSES : INACTIVE_CLASSES
                    }`}
            >
                Todas
            </Link>

            {CATEGORIES.map((category) => (
                <Link
                    key={category}
                    to={`/catalogo?categoria=${encodeURIComponent(category)}`}
                    aria-current={activeCategory === category ? "page" : undefined}
                    className={`${BASE_CLASSES} ${activeCategory === category
                            ? ACTIVE_CLASSES
                            : INACTIVE_CLASSES
                        }`}
                >
                    {category}
                </Link>
            ))}
        </nav>
    );
}

export default CategorySidebar;