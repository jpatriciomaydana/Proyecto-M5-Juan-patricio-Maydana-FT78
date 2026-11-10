import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import type { JSX, ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import AppProviders from "../providers/AppProviders";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
    // Ruta inicial del router en memoria (por defecto "/").
    route?: string;
}

// Renderiza un componente con lo mismo que lo rodea en la app:
// router + AppProviders (Auth → Product → Cart → Order).
// Los tests que lo usen deben mockear los servicios (vi.mock), así no se
// inicializa Firebase ni se llama a /api de verdad.
export function renderWithProviders(
    ui: ReactElement,
    { route = "/", ...options }: RenderWithProvidersOptions = {},
): RenderResult {
    function Wrapper({ children }: { children: ReactNode }): JSX.Element {
        return (
            <MemoryRouter initialEntries={[route]}>
                <AppProviders>{children}</AppProviders>
            </MemoryRouter>
        );
    }

    return render(ui, { wrapper: Wrapper, ...options });
}