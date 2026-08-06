/** Genera un slug URL-friendly a partir de un texto, ej. "Netflix Premium 4K" -> "netflix-premium-4k". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Agrega un sufijo corto aleatorio para evitar colisiones de slug. */
export function slugifyUnique(text: string): string {
  const base = slugify(text);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
