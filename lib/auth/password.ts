import bcrypt from "bcryptjs";

// Hash unidireccional para contraseñas de LOGIN de usuarios (clientes,
// proveedores, admin). No confundir con lib/crypto/credentials.ts, que es
// cifrado reversible para credenciales de cuentas streaming.

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
