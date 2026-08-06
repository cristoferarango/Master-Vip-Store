/** Suma días a una fecha base y devuelve la fecha de vencimiento resultante. */
export function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

export function isExpired(expirationDate: Date): boolean {
  return expirationDate.getTime() < Date.now();
}

/** Días restantes hasta el vencimiento (negativo si ya venció). */
export function daysUntil(expirationDate: Date): number {
  const diffMs = expirationDate.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDatePE(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
