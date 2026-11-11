
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Footer from "../../../components/layout/Footer";

describe("Footer", () => {
    it("muestra los créditos del desarrollador", () => {
        render(<Footer />);

        expect(screen.getByText("Juan Patricio Maydana")).toBeInTheDocument();
        expect(screen.getByText("Patagonix Tech")).toBeInTheDocument();
    });

    it("muestra el año actual en el copyright", () => {
        render(<Footer />);

        const currentYear = new Date().getFullYear();

        expect(
            screen.getByText(
                `© ${currentYear} Todos los derechos reservados.`,
            ),
        ).toBeInTheDocument();
    });

    it("renderiza el elemento semántico footer", () => {
        render(<Footer />);

        expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });
});
