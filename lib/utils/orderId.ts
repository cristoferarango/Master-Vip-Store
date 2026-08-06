/** Referencia corta y legible de una compra a partir de su id real (cuid). */
export function formatOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}
