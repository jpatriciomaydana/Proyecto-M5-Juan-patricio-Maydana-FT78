import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ErrorMessage from "../../../components/common/ErrorMessage";

describe("ErrorMessage", () => {
    it("muestra el mensaje", () => {
        render(<ErrorMessage message="No pudimos cargar los libros." />);

        expect(
            screen.getByText("No pudimos cargar los libros."),
        ).toBeInTheDocument();
    });

    it("se anuncia como alerta", () => {
        render(<ErrorMessage message="Falló" />);

        expect(screen.getByRole("alert")).toHaveTextContent("Falló");
    });
});
