import type { JSX, ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
}

function EmptyState({
    title,
    description,
    icon,
    action,
}: EmptyStateProps): JSX.Element {
    return (
        <div className="mx-auto max-w-md rounded border border-line bg-white px-6 py-10 text-center">
            {icon && (
                <span
                    aria-hidden="true"
                    className="mb-3 inline-flex text-gold"
                >
                    {icon}
                </span>
            )}
            <p className="m-0 font-serif text-xl text-forest">{title}</p>
            {description && (
                <p className="mb-0 mt-2 text-muted">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export default EmptyState;