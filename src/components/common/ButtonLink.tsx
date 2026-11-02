import type { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";

interface ButtonLinkProps {
    to: string;
    children: ReactNode;
}

function ButtonLink({ to, children }: ButtonLinkProps): JSX.Element {
    return (
        <Link
            to={to}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-forest px-5 text-cream no-underline hover:bg-forest-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
            {children}
        </Link>
    );
}

export default ButtonLink;