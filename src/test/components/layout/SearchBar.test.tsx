
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import SearchBar from "../../../components/layout/SearchBar";

function LocationDisplay() {
    const location = useLocation();

    return <p data-testid="current-url">{location.pathname}{location.search}</p>;
}

function renderSearchBar(initialEntry = "/catalogo") {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="*"
                    element={
                        <>
                            <SearchBar />
                            <LocationDisplay />
                        </>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe("SearchBar", () => {
    it("muestra el término de búsqueda que está en la URL", () => {
        renderSearchBar("/catalogo?q=terror");

        expect(screen.getByRole("searchbox")).toHaveValue("terror");
    });

    it("actualiza el parámetro q al escribir", () => {
        renderSearchBar("/catalogo");

        fireEvent.change(screen.getByRole("searchbox"), {
            target: { value: "borges" },
        });

        expect(screen.getByTestId("current-url")).toHaveTextContent(
            "/catalogo?q=borges",
        );
    });

    it("conserva la categoría al cambiar la búsqueda", () => {
        renderSearchBar("/catalogo?category=Terror&q=viejo");

        fireEvent.change(screen.getByRole("searchbox"), {
            target: { value: "borges" },
        });

        expect(screen.getByTestId("current-url")).toHaveTextContent(
            "/catalogo?category=Terror&q=borges",
        );
    });

    it("elimina el parámetro q cuando se borra el texto", () => {
        renderSearchBar("/catalogo?q=terror");

        fireEvent.change(screen.getByRole("searchbox"), {
            target: { value: "" },
        });

        expect(screen.getByTestId("current-url")).toHaveTextContent(
            "/catalogo",
        );
    });

    it("muestra el campo vacío fuera del catálogo", () => {
        renderSearchBar("/");

        expect(screen.getByRole("searchbox")).toHaveValue("");
    });

    it("ejecuta onSearch al enviar el formulario", () => {
        const onSearch = vi.fn();

        render(
            <MemoryRouter>
                <SearchBar onSearch={onSearch} />
            </MemoryRouter>,
        );

        fireEvent.submit(screen.getByRole("search"));

        expect(onSearch).toHaveBeenCalledOnce();
    });
});
