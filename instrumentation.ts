/**
 * Arranca UNA vez cuando el servidor de Next.js inicia (dev o producción,
 * con o sin server.js) — ver node_modules/next/dist/docs/.../instrumentation.md.
 * Lo usamos para correr la revisión de vencimientos sola, sin depender de
 * que alguien entre al Panel Master y apriete el botón manual.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { runExpirationSweep } = await import("./lib/cron/expirationSweep");
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  const run = () => {
    runExpirationSweep().catch((err) => {
      console.error("[cron] expirationSweep falló:", err);
    });
  };

  // Corre una vez al arrancar (con un pequeño respiro para no competir con
  // el arranque del server) y después cada 6 horas.
  setTimeout(run, 30_000);
  setInterval(run, SIX_HOURS_MS);
}
