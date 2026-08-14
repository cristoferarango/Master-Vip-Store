/** Hora actual en Lima (America/Lima, UTC-5 fijo) como "HH:mm". */
export function nowInLima(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * true si `now` cae dentro de [opensAt, closesAt) — soporta horarios que
 * cruzan la medianoche (ej. abre 18:00, cierra 02:00). Si falta alguno de
 * los dos extremos, se interpreta como "disponible todo el día".
 */
export function isWithinSchedule(
  opensAt: string | null | undefined,
  closesAt: string | null | undefined,
  now: string = nowInLima()
): boolean {
  if (!opensAt || !closesAt || opensAt === closesAt) return true;
  if (opensAt < closesAt) return now >= opensAt && now < closesAt;
  return now >= opensAt || now < closesAt; // cruza medianoche
}
