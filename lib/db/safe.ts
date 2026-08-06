import "server-only";

/**
 * Envuelve una consulta a la base de datos para que, si la conexión falla
 * (ej. DATABASE_URL todavía no configurada o la base está caída), la página
 * muestre un aviso amigable en vez de la pantalla de error de Next.js.
 */
export async function safeQuery<T>(
  query: () => Promise<T>,
  fallback: T
): Promise<{ data: T; dbError: boolean }> {
  try {
    const data = await query();
    return { data, dbError: false };
  } catch (err) {
    console.error(
      "[db] La consulta falló — revisa que DATABASE_URL esté configurada en .env:",
      err instanceof Error ? err.message : err
    );
    return { data: fallback, dbError: true };
  }
}
