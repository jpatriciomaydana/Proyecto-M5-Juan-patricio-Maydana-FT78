import { useEffect, useState } from "react";

// Devuelve el valor recibido, pero "retrasado": solo se actualiza cuando
// pasaron `delay` milisegundos sin que el valor original cambie.
// Sirve para el buscador: filtramos al terminar de escribir, no en cada tecla.
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Si el valor cambia antes de tiempo, se cancela el timer anterior
        // (esa es la función que devuelve el efecto) y arranca uno nuevo.
        const timer = setTimeout(() => setDebouncedValue(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}