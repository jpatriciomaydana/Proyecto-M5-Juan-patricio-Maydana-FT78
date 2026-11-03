import type { InputHTMLAttributes, JSX } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
    id: string;
    label: string;
    // Mensaje de error visible debajo del campo. Si no hay, no se muestra nada.
    error?: string;
}

// Campo de formulario con su etiqueta y su mensaje de error.
// El id une la etiqueta con el campo, y el error con el campo (lectores de pantalla).
function Input({ id, label, error, ...inputProps }: InputProps): JSX.Element {
    const errorId = `${id}-error`;

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-semibold text-ink">
                {label}
            </label>

            <input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`min-h-11 rounded border bg-white px-3 text-base text-ink placeholder:text-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold ${error ? "border-danger" : "border-line"
                    }`}
                {...inputProps}
            />

            {error && (
                <p id={errorId} className="m-0 text-sm text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

export default Input;