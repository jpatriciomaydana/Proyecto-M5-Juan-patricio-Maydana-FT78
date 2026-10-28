import type { JSX } from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
}

function EmptyState({ title, description }: EmptyStateProps): JSX.Element {
    return (
        <div className="mx-auto max-w-md rounded border border-line bg-white px-6 py-10 text-center">
            <p className="m-0 font-serif text-xl text-forest">{title}</p>
            {description && (
                <p className="mb-0 mt-2 text-muted">{description}</p>
            )}
        </div>
    );
}

export default EmptyState;