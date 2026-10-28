import type { JSX } from "react";

interface SpinnerProps {
    label?: string;
}

function Spinner({ label = "Cargando..." }: SpinnerProps): JSX.Element {
    return (
        <div
            role="status"
            className="flex flex-col items-center justify-center gap-3 py-12 text-muted"
        >
            <span
                aria-hidden="true"
                className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-forest"
            />
            <span>{label}</span>
        </div>
    );
}

export default Spinner;