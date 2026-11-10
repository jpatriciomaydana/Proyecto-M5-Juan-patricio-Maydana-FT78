import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "../../hooks/useDebounce";

describe("useDebounce", () => {
    // Timers falsos: el test avanza el reloj a mano en vez de esperar de verdad.
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("devuelve el valor inicial enseguida", () => {
        const { result } = renderHook(() => useDebounce("hola", 300));

        expect(result.current).toBe("hola");
    });

    it("no actualiza el valor antes de que pase el tiempo", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: "a" } },
        );

        rerender({ value: "b" });
        act(() => {
            vi.advanceTimersByTime(299);
        });

        expect(result.current).toBe("a");
    });

    it("actualiza el valor cuando pasa el tiempo", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: "a" } },
        );

        rerender({ value: "b" });
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toBe("b");
    });

    it("reinicia la espera si el valor cambia antes de tiempo", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: "a" } },
        );

        rerender({ value: "b" });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        rerender({ value: "c" });
        act(() => {
            vi.advanceTimersByTime(200);
        });

        // Pasaron 400 ms en total, pero solo 200 desde el último cambio.
        expect(result.current).toBe("a");

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(result.current).toBe("c");
    });

    it("usa 300 ms por defecto", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value),
            { initialProps: { value: "a" } },
        );

        rerender({ value: "b" });
        act(() => {
            vi.advanceTimersByTime(299);
        });
        expect(result.current).toBe("a");

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe("b");
    });

    it("respeta un tiempo distinto", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 1000),
            { initialProps: { value: "a" } },
        );

        rerender({ value: "b" });
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(result.current).toBe("a");

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe("b");
    });
});