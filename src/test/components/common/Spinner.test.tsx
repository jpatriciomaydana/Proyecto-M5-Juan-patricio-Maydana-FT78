import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Spinner from "../../../components/common/Spinner";

describe("Spinner", () => {
    it("muestra 'Cargando...' por defecto", () => {
        render(<Spinner />);

        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("muestra el texto que se le pasa", () => {
        render(<Spinner label="Buscando libros..." />);

        expect(screen.getByText("Buscando libros...")).toBeInTheDocument();
    });

    it("avisa a los lectores de pantalla con role status", () => {
        render(<Spinner />);

        expect(screen.getByRole("status")).toBeInTheDocument();
    });
});