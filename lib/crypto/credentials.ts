import crypto from "node:crypto";

/**
 * Cifrado simétrico reversible (AES-256-GCM) para credenciales de cuentas
 * streaming (usuario/contraseña que suben los proveedores).
 *
 * IMPORTANTE: esto NO es para contraseñas de login de usuarios de la
 * plataforma — esas van con bcrypt en lib/auth/password.ts (hash
 * unidireccional). Este módulo es solo para secretos que la aplicación
 * necesita poder mostrar en claro al comprador o al admin.
 *
 * Solo debe usarse desde Server Actions / Route Handlers, nunca desde
 * componentes de cliente ni exponerse en el bundle del navegador.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recomendado para GCM

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY no está configurada. Define una clave de 32 bytes en base64 en .env"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY debe decodificar a 32 bytes (AES-256), se obtuvieron ${key.length}.`
    );
  }
  return key;
}

/**
 * Cifra un texto plano y devuelve un string almacenable con el formato
 * "iv:authTag:cipherText" (cada parte en base64).
 */
export function encryptSecret(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Descifra un valor generado por encryptSecret. Lanza si el authTag no
 * valida (dato corrupto o manipulado) o si el formato es inválido.
 */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de secreto cifrado inválido.");
  }
  const [ivB64, authTagB64, cipherTextB64] = parts;

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const cipherText = Buffer.from(cipherTextB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(cipherText),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
