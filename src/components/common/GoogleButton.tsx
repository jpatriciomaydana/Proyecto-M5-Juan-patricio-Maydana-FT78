import type { JSX } from "react";

import { GoogleIcon } from "./Icons";

interface GoogleButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

// Botón "Continuar con Google". Solo se encarga de verse bien:
// qué pasa al hacer clic lo decide la pantalla que lo usa.
function GoogleButton({
    onClick,
    disabled = false,
}: GoogleButtonProps): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-line bg-white px-4 font-semibold text-ink hover:bg-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
            <GoogleIcon />
            Continuar con Google
        </button>
    );
}

export default GoogleButton;