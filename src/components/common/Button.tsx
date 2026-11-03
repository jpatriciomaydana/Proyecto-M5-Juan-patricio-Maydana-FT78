import type { ButtonHTMLAttributes, JSX } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary";
}

const BASE_CLASSES =
    "inline-flex min-h-11 items-center justify-center rounded-md px-5 text-base font-semibold " +
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold " +
    "disabled:cursor-not-allowed disabled:opacity-60";

const VARIANT_CLASSES = {
    primary: "border border-forest bg-forest text-cream hover:bg-forest-dark",
    secondary: "border border-forest bg-transparent text-forest hover:bg-forest hover:text-cream",
};

// Botón con el estilo de la librería. Por defecto es type="button" para que
// no envíe un formulario sin querer; en los formularios se pasa type="submit".
function Button({
    variant = "primary",
    type = "button",
    className,
    ...buttonProps
}: ButtonProps): JSX.Element {
    return (
        <button
            type={type}
            className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
            {...buttonProps}
        />
    );
}

export default Button;