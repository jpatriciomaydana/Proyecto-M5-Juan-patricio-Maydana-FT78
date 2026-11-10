import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Input from "../../../components/common/Input";

describe("Input", () => {
    it("une la etiqueta con el campo", () => {
        render(<Input id="email" label="Correo" />);

        expect(screen.getByLabelText("Correo")).toHaveAttribute("id", "email");
    });

    it("no muestra error si no hay", () => {
        render(<Input id="email" label="Correo" />);

        const input = screen.getByLabelText("Correo");

        expect(screen.queryByText(/Ingresá/)).not.toBeInTheDocument();
        expect(input).not.toHaveAttribute("aria-invalid");
        expect(input).not.toHaveAttribute("aria-describedby");
    });

    it("muestra el error y lo asocia al campo", () => {
        render(<Input id="email" label="Correo" error="Ingresá tu correo." />);

        const input = screen.getByLabelText("Correo");
        const error = screen.getByText("Ingresá tu correo.");

        expect(error).toHaveAttribute("id", "email-error");
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(input).toHaveAttribute("aria-describedby", "email-error");
    });

    it("pasa el resto de atributos al input", () => {
        render(
            <Input
                id="email"
                label="Correo"
                type="email"
                placeholder="nombre@correo.com"
            />,
        );

        const input = screen.getByLabelText("Correo");

        expect(input).toHaveAttribute("type", "email");
        expect(input).toHaveAttribute("placeholder", "nombre@correo.com");
    });

    it("avisa cuando se escribe", () => {
        const onChange = vi.fn();

        render(<Input id="email" label="Correo" onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Correo"), {
            target: { value: "a@b.com" },
        });

        expect(onChange).toHaveBeenCalledTimes(1);
    });
});