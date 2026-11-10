import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Button from "../../../components/common/Button";

describe("Button", () => {
    it("muestra su contenido", () => {
        render(<Button>Confirmar</Button>);

        expect(
            screen.getByRole("button", { name: "Confirmar" }),
        ).toBeInTheDocument();
    });

    it("es type=button por defecto (no envía formularios sin querer)", () => {
        render(<Button>Confirmar</Button>);

        expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("acepta type=submit", () => {
        render(<Button type="submit">Enviar</Button>);

        expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("usa el estilo primary por defecto", () => {
        render(<Button>Confirmar</Button>);

        expect(screen.getByRole("button")).toHaveClass("bg-forest");
    });

    it("usa el estilo secondary si se pide", () => {
        render(<Button variant="secondary">Cancelar</Button>);

        expect(screen.getByRole("button")).toHaveClass("bg-transparent");
    });

    it("suma la clase que se le pasa", () => {
        render(<Button className="mt-4">Confirmar</Button>);

        expect(screen.getByRole("button")).toHaveClass("mt-4");
    });

    it("llama a onClick al hacer clic", () => {
        const onClick = vi.fn();

        render(<Button onClick={onClick}>Confirmar</Button>);
        fireEvent.click(screen.getByRole("button"));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("deshabilitado no llama a onClick", () => {
        const onClick = vi.fn();

        render(
            <Button disabled onClick={onClick}>
                Confirmar
            </Button>,
        );
        fireEvent.click(screen.getByRole("button"));

        expect(screen.getByRole("button")).toBeDisabled();
        expect(onClick).not.toHaveBeenCalled();
    });
});