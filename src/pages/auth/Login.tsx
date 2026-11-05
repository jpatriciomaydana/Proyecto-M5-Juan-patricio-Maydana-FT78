import { useState } from "react";
import type { ChangeEvent, FormEvent, JSX } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import GoogleButton from "../../components/common/GoogleButton";
import Input from "../../components/common/Input";
import { useAuthContext } from "../../hooks/useAuthContext";
import { getReturnTo } from "../../utils/navigation";

interface LoginErrors {
    email?: string;
    password?: string;
}

// Chequeo simple de formato: algo@algo.algo, sin espacios.
function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(email: string, password: string): LoginErrors {
    const errors: LoginErrors = {};

    if (!email.trim()) {
        errors.email = "Ingresá tu correo electrónico.";
    } else if (!isValidEmail(email.trim())) {
        errors.email = "Ingresá un correo válido, por ejemplo nombre@correo.com.";
    }

    if (!password) {
        errors.password = "Ingresá tu contraseña.";
    }

    return errors;
}

// Traduce el código de error de Firebase a un mensaje para la persona.
function getLoginErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";

    if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
    ) {
        return "Correo o contraseña incorrectos.";
    }

    if (code === "auth/too-many-requests") {
        return "Demasiados intentos. Probá de nuevo en unos minutos.";
    }

    if (code === "auth/network-request-failed") {
        return "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.";
    }

    return "No pudimos iniciar sesión. Intentá de nuevo.";
}

// Igual que el anterior, para el ingreso con Google. Si la persona cierra
// la ventana de Google no es una falla: devuelve "" y no se muestra error.
function getGoogleErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";

    if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
    ) {
        return "";
    }

    if (code === "auth/popup-blocked") {
        return "El navegador bloqueó la ventana de Google. Permitila e intentá de nuevo.";
    }

    if (code === "auth/network-request-failed") {
        return "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.";
    }

    return "No pudimos ingresar con Google. Intentá de nuevo.";
}

function Login(): JSX.Element {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<LoginErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuthContext();
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

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        setSubmitError("");

        const foundErrors = validate(email, password);
        setErrors(foundErrors);

        if (Object.keys(foundErrors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            await login(email.trim(), password);
            navigate(getReturnTo(location.state));
        } catch (error) {
            setSubmitError(getLoginErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleClick(): Promise<void> {
        setSubmitError("");
        setLoading(true);

        try {
            await loginWithGoogle();
            navigate(getReturnTo(location.state));
        } catch (error) {
            setSubmitError(getGoogleErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="mx-auto w-full max-w-md px-4 py-10">
            <h1 className="m-0 text-center font-serif text-3xl text-forest">
                Iniciar sesión
            </h1>
            <p className="mt-2 mb-6 text-center text-muted">
                Accedé a tu cuenta.
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
                    autoComplete="current-password"
                    error={errors.password}
                />

                <Button type="submit" disabled={loading}>
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
            </form>

            <div className="mt-4 flex flex-col gap-4">
                <div
                    className="flex items-center gap-3 text-muted"
                    aria-hidden="true"
                >
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-sm">o</span>
                    <span className="h-px flex-1 bg-line" />
                </div>

                <GoogleButton onClick={handleGoogleClick} disabled={loading} />
            </div>

            <p className="mt-4 text-center text-muted">
                ¿No tenés cuenta?{" "}
                <Link
                    to="/registro"
                    state={location.state}
                    className="font-semibold text-gold-dark underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                    Crear cuenta
                </Link>
            </p>
        </section>
    );
}

export default Login;