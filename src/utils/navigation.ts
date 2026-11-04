// Adónde volver tras iniciar sesión o registrarse. Solo se aceptan rutas
// internas ("/carrito"), nunca direcciones externas.
export function getReturnTo(state: unknown): string {
    if (typeof state === "object" && state !== null && "returnTo" in state) {
        const { returnTo } = state as { returnTo: unknown };

        if (
            typeof returnTo === "string" &&
            returnTo.startsWith("/") &&
            !returnTo.startsWith("//")
        ) {
            return returnTo;
        }
    }

    return "/catalogo";
}