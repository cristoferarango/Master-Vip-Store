import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "mvs_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 días

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  /** true si la cuenta tiene acceso al Panel VIP. */
  isAdmin: boolean;
  /** id del Provider si esta cuenta también tiene perfil de proveedor (null si no). */
  providerId?: string | null;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET no está configurada en .env");
  }
  return new TextEncoder().encode(secret);
}

/** Firma un JWT de sesión y lo guarda en una cookie httpOnly. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/** Lee y verifica la cookie de sesión actual. Devuelve null si no hay sesión o es inválida. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
