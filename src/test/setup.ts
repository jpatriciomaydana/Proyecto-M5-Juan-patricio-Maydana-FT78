import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sin globales de Vitest, Testing Library no limpia el DOM sola:
// se desmonta lo renderizado después de cada test.
afterEach(() => {
    cleanup();
});