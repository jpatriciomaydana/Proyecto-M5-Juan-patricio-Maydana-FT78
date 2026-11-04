import { useState } from "react";
import type { ChangeEvent, FormEvent, JSX } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import Input from "../../components/common/Input";
import { useAuthContext } from "../../hooks/useAuthContext";
import { getReturnTo } from "../../utils/navigation";

// Mínimo que exige Firebase Auth para una contraseña.
const MIN_PASSWORD_LENGTH = 6;

interface RegisterErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
}

// Chequeo simple de formato: algo@algo.algo, sin espacios.
function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(
    email: string,
    password: string,
    confirmPassword: string,
): RegisterErrors {
    const errors: RegisterErrors = {};

    if (!email.trim()) {
        errors.email = "Ingresá tu correo electrónico.";
    } else if (!isValidEmail(email.trim())) {
        errors.email = "Ingresá un correo válido, por ejemplo nombre@correo.com.";
    }

    if (!password) {
        errors.password = "Ingresá una contraseña.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    if (!confirmPassword) {
        errors.confirmPassword = "Repetí la contraseña.";
    } else if (confirmPassword !== password) {
        errors.confirmPassword = "Las contraseñas no coinciden.";
    }

    return errors;
}

// Traduce el código de error de Firebase a un mensaje para la persona.
function getRegisterErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";

    if (code === "auth/email-already-in-use") {
        return "Ya existe una cuenta con ese correo. Probá iniciar sesión.";
    }

    if (code === "auth/weak-password") {
        return "La contraseña es muy débil. Elegí una más larga.";
    }

    if (code === "auth/network-request-failed") {
        return "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.";
    }

    return "No pudimos crear la cuenta. Intentá de nuevo.";
}

function Register(): JSX.Element {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [loading, setLoading] = useState(false);

    const { register } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();

    function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
        setEmail(event.target.value);
        setErrors((previous) => ({ ...previous, email: undefined }));
    }

    function handlePasswordChange(event: ChangeEvent<HTMLInputElement>): void {
        setPassword(event.target.value);
        setErrors((previous) => ({ ...previous, password: undefined }));
    }

    function handleConfirmChange(event: ChangeEvent<HTMLInputElement>): void {
        setConfirmPassword(event.target.value);
        setErrors((previous) => ({ ...previous, confirmPassword: undefined }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        setSubmitError("");

        const foundErrors = validate(email, password, confirmPassword);
        setErrors(foundErrors);

        if (Object.keys(foundErrors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            await register(email.trim(), password);
            navigate(getReturnTo(location.state));
        } catch (error) {
            console.error("Error al crear la cuenta:", error);
            setSubmitError(getRegisterErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="mx-auto w-full max-w-md px-4 py-10">
            <h1 className="m-0 text-center font-serif text-3xl text-forest">
                Crear cuenta
            </h1>
            <p className="mt-2 mb-6 text-center text-muted">
                Registrate para comenzar a comprar.
            </p>

            <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-4 rounded-md border border-line bg-white p-5"
            >
                {submitError && <ErrorMessage message={submitError} />}

                <Input
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    error={errors.email}
                />

                <Input
                    id="password"
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    error={errors.password}
                />

                <Input
                    id="confirmPassword"
                    label="Confirmar contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmChange}
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                />

                <Button type="submit" disabled={loading}>
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
            </form>

            <p className="mt-4 text-center text-muted">
                ¿Ya tenés cuenta?{" "}
                <Link
                    to="/login"
                    state={location.state}
                    className="font-semibold text-gold-dark underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                    Iniciar sesión
                </Link>
            </p>
        </section>
    );
}

export default Register;