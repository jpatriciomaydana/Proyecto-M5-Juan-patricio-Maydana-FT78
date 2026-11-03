// Deja el texto listo para comparar: sin tildes, en minúsculas y sin espacios
// en los bordes. Así "Ficción", "ficcion" y "FICCIÓN" coinciden.
export function normalizeText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}