import "server-only";

/**
 * Rate limit en memoria, best-effort — suficiente para un solo proceso/VPS
 * (que es como se despliega esta app, ver README). No sobrevive un reinicio
 * ni se comparte entre instancias; si algún día se corre en múltiples
 * instancias/serverless, reemplazar por algo compartido (Redis, etc.).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Limpieza periódica para no acumular memoria indefinidamente.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  },
  10 * 60 * 1000
).unref?.();

/**
 * Devuelve true si la acción está permitida (y cuenta el intento), false si
 * se superó el límite de `max` intentos en la ventana de `windowMs`.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}

/** IP del cliente a partir de las cabeceras que pone el proxy/hosting (X-Forwarded-For). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
