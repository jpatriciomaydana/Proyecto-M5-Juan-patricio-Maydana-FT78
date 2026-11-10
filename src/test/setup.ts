import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./server";

// Si un test hace un pedido de red sin handler, falla: nada sale a internet.
// (En msw 3 la opción se llama onUnhandledFrame.)
beforeAll(() => {
    server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
    // Sin globales de Vitest, Testing Library no limpia el DOM sola:
    // se desmonta lo renderizado después de cada test.
    cleanup();
    // Los handlers que agregó un test no pasan al siguiente.
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});