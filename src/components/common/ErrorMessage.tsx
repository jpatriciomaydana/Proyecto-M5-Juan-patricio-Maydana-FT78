import type { JSX } from "react";

interface ErrorMessageProps {
    message: string;
}

function ErrorMessage({ message }: ErrorMessageProps): JSX.Element {
    return (
        <p
            role="alert"
            className="mx-auto my-6 max-w-md rounded border border-danger bg-white px-4 py-3 text-center text-danger"
        >
            {message}
        </p>
    );
}

export default ErrorMessage;