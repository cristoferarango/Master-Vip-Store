import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

/** Exige cualquier sesión activa (para Streaming: cualquier cuenta puede comprar). */
export async function requireSession(loginPath: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  return session;
}

/** Exige que la cuenta tenga perfil de proveedor (providerId presente en la sesión). */
export async function requireProviderSession(loginPath: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !session.providerId) redirect(loginPath);
  return session;
}

/** Exige que la cuenta sea admin (Panel VIP). */
export async function requireAdminSession(loginPath: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !session.isAdmin) redirect(loginPath);
  return session;
}

/** Variante que no redirige, solo devuelve la sesión (o null). Útil para UI condicional. */
export async function getOptionalSession(): Promise<SessionPayload | null> {
  return getSession();
}
