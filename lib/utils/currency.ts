/** Formatea un número/Decimal como soles peruanos, ej. "S/ 45.90". */
export function formatSoles(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}
