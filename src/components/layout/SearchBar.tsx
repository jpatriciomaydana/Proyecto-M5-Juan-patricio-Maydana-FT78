import type { ChangeEvent, FormEvent, JSX } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

interface SearchBarProps {
    // Se llama al apretar Enter (en celular cierra el menú desplegable).
    onSearch?: () => void;
}

// Buscador del subnavbar. No guarda el texto: lo lee y lo escribe en la URL
// (/catalogo?q=terror). Catalog lee esa misma URL y filtra.
function SearchBar({ onSearch }: SearchBarProps): JSX.Element {
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const onCatalog = pathname === "/catalogo";
    // Fuera del catálogo el campo se ve vacío.
    const value = onCatalog ? (searchParams.get("q") ?? "") : "";

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const text = event.target.value;
        // Dentro del catálogo se conservan los otros parámetros (la categoría).
        const params = new URLSearchParams(onCatalog ? searchParams : undefined);

        if (text) {
            params.set("q", text);
        } else {
            params.delete("q");
        }

        const queryString = params.toString();

        // replace: escribir no llena el historial con una entrada por tecla.
        navigate(
            {
                pathname: "/catalogo",
                search: queryString ? `?${queryString}` : "",
            },
            { replace: onCatalog },
        );
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        onSearch?.();
    }

    return (
        <form
            role="search"
            onSubmit={handleSubmit}
            className="relative order-first mb-2 lg:order-none lg:mb-0 lg:ml-auto lg:self-center"
        >
            <label htmlFor="site-search" className="sr-only">
                Buscar libros por título o autor
            </label>

            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
            </svg>

            <input
                id="site-search"
                type="search"
                value={value}
                onChange={handleChange}
                placeholder="Buscar título o autor"
                autoComplete="off"
                className="h-11 w-full rounded border border-line bg-cream pr-3 pl-10 text-base text-ink placeholder:text-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold lg:h-10 lg:w-72"
            />
        </form>
    );
}

export default SearchBar;