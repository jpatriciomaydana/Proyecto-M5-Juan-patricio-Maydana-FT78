import { useState } from "react";
import type { JSX } from "react";

interface AvatarProps {
    photoURL: string | null;
    name: string;
}

// Círculo con la foto de la persona o, si no hay foto (o no carga),
// la inicial de su nombre. Es decorativo: el nombre ya se muestra al lado.
function Avatar({ photoURL, name }: AvatarProps): JSX.Element {
    const [failed, setFailed] = useState(false);

    if (photoURL && !failed) {
        return (
            <img
                src={photoURL}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
        );
    }

    const initial = name.trim().charAt(0).toUpperCase();

    return (
        <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream"
        >
            {initial}
        </span>
    );
}

export default Avatar;