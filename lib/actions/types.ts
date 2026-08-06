// Tipos compartidos por los server actions. Vive en un archivo aparte (sin
// "use server") porque esos archivos solo pueden exportar funciones async
// — ni tipos ni clases.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
