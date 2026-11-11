
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Avatar from "../../../components/common/Avatar";

describe("Avatar", () => {
    it("muestra la foto cuando existe una URL", () => {
        render(<Avatar photoURL="https://example.com/foto.jpg" name="Juan" />);

        const image = document.querySelector("img");

        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute(
            "src",
            "https://example.com/foto.jpg",
        );
        expect(image).toHaveAttribute("alt", "");
    });

    it("muestra la inicial cuando no hay foto", () => {
        render(<Avatar photoURL={null} name="Juan" />);

        expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("convierte la inicial a mayúscula", () => {
        render(<Avatar photoURL={null} name="  patricio" />);

        expect(screen.getByText("P")).toBeInTheDocument();
    });

    it("muestra la inicial si la foto no carga", () => {
        render(<Avatar photoURL="https://example.com/foto.jpg" name="María" />);

        fireEvent.error(document.querySelector("img")!);

        expect(screen.getByText("M")).toBeInTheDocument();
        expect(document.querySelector("img")).not.toBeInTheDocument();
    });
});
