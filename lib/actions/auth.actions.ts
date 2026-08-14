import "server-only";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { sendNotification } from "@/lib/notifications/notify";
import { generateReferralCode } from "@/lib/utils/referral";
import type { RegisterClientInput, RegisterProviderInput, LoginInput } from "@/lib/validators/auth.schema";

export class AuthError extends Error {}

/**
 * WhatsApp del dueño (única cuenta con isAdmin=true) — usado como contacto
 * público de "olvidé mi contraseña": el formulario le arma un WhatsApp
 * pre-llenado al dueño, quien le cambia la contraseña a mano desde
 * Panel Master → Usuarios (esa cuenta nunca guarda la contraseña en claro,
 * solo su hash — ver lib/auth/password.ts).
 */
export async function getSupportWhatsapp(): Promise<string | null> {
  const admin = await prisma.user.findFirst({ where: { isAdmin: true }, select: { whatsapp: true } });
  return admin?.whatsapp ?? null;
}

/** Genera un código de referido único (reintenta si por casualidad choca con uno existente). */
async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    const taken = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!taken) return code;
  }
  return `${generateReferralCode()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Si vino un código de referido válido, la cuenta nueva queda marcada como
 * seller PENDIENTE — el dueño (u otro seller) la activa desde el Panel VIP,
 * y recién ahí ve los precios "Seller" de los productos.
 */
async function resolveSellerFields(referredByCode?: string) {
  if (!referredByCode) return { isSeller: false as const, sellerStatus: undefined, referredByCode: undefined };
  const referrer = await prisma.user.findUnique({ where: { referralCode: referredByCode } });
  if (!referrer) throw new AuthError("El código de referido no existe.");
  return { isSeller: true as const, sellerStatus: "PENDIENTE" as const, referredByCode };
}

/**
 * Una misma cuenta (mismo correo) puede tener varias capacidades a la vez:
 * comprar en Streaming (cualquier cuenta logueada puede), vender en
 * Proveedores (si tiene providerProfile) y administrar en VIP (si
 * isAdmin=true). Por eso "registrarse" en un panel cuando el correo YA
 * existe no falla — si la contraseña coincide, simplemente se le agrega
 * esa capacidad a la cuenta existente en vez de crear una cuenta nueva.
 */

/** Registra un CLIENTE nuevo, o inicia sesión si el correo ya existe y la contraseña coincide (cualquier cuenta puede comprar). */
export async function registerClient(input: RegisterClientInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    const valid = await verifyPassword(input.password, existing.passwordHash);
    if (!valid) throw new AuthError("Ese correo ya está registrado con otra contraseña.");

    return loginExistingUser(existing.id);
  }

  const usernameTaken = await prisma.user.findUnique({ where: { username: input.username } });
  if (usernameTaken) throw new AuthError("Ese nombre de usuario ya está ocupado.");

  const passwordHash = await hashPassword(input.password);
  const referralCode = await uniqueReferralCode();
  const sellerFields = await resolveSellerFields(input.referredByCode || undefined);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      username: input.username,
      whatsapp: input.whatsapp,
      role: "CLIENTE",
      referralCode,
      ...sellerFields,
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.isAdmin,
  });

  await sendNotification({
    userId: user.id,
    type: "BIENVENIDA",
    title: `¡Bienvenido a Master Vip Store, ${user.name}!`,
    message: sellerFields.isSeller
      ? "Ya puedes explorar el catálogo. Tu solicitud como seller está pendiente de activación."
      : "Ya puedes explorar el catálogo y comprar tu primera cuenta.",
  });

  return user;
}

/**
 * Registra un PROVEEDOR nuevo (queda PENDIENTE hasta que el admin lo active),
 * o le agrega el perfil de proveedor a una cuenta existente si el correo ya
 * existe y la contraseña coincide.
 */
export async function registerProvider(input: RegisterProviderInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    include: { providerProfile: true },
  });

  if (existing) {
    const valid = await verifyPassword(input.password, existing.passwordHash);
    if (!valid) throw new AuthError("Ese correo ya está registrado con otra contraseña.");

    if (existing.providerProfile) {
      // Ya tiene perfil de proveedor: solo inicia sesión, no hace falta crear nada.
      return loginExistingUser(existing.id);
    }

    await prisma.provider.create({
      data: {
        userId: existing.id,
        businessName: input.businessName,
        status: "PENDIENTE",
      },
    });

    await sendNotification({
      userId: existing.id,
      type: "BIENVENIDA",
      title: "Tu perfil de proveedor está en revisión",
      message: "Te avisaremos apenas sea aprobado y puedas publicar productos.",
    });

    return loginExistingUser(existing.id);
  }

  const usernameTaken = await prisma.user.findUnique({ where: { username: input.username } });
  if (usernameTaken) throw new AuthError("Ese nombre de usuario ya está ocupado.");

  const passwordHash = await hashPassword(input.password);
  const referralCode = await uniqueReferralCode();
  const sellerFields = await resolveSellerFields(input.referredByCode || undefined);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      username: input.username,
      whatsapp: input.whatsapp,
      role: "PROVEEDOR",
      referralCode,
      ...sellerFields,
      providerProfile: {
        create: {
          businessName: input.businessName,
          status: "PENDIENTE",
        },
      },
    },
    include: { providerProfile: true },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.isAdmin,
    providerId: user.providerProfile?.id ?? null,
  });

  await sendNotification({
    userId: user.id,
    type: "BIENVENIDA",
    title: `¡Bienvenido, ${user.name}!`,
    message: "Tu solicitud de proveedor está en revisión. Te avisaremos apenas sea aprobada.",
  });

  return user;
}

/** Crea la sesión para una cuenta que ya existe (usado cuando "registrarse" en realidad agrega una capacidad a una cuenta existente). */
async function loginExistingUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { providerProfile: true },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.isAdmin,
    providerId: user.providerProfile?.id ?? null,
  });

  return user;
}

/** Login genérico: sirve para cualquier cuenta — el acceso a cada panel se decide por capacidad (ver session.ts), no por un rol único. */
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    include: { providerProfile: true },
  });
  if (!user) throw new AuthError("Usuario o contraseña incorrectos.");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new AuthError("Usuario o contraseña incorrectos.");

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.isAdmin,
    providerId: user.providerProfile?.id ?? null,
  });

  return user;
}

export async function logout() {
  await destroySession();
}

/** Cambia la contraseña de la cuenta en sesión, verificando la contraseña actual. */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new AuthError("Tu contraseña actual no es correcta.");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

/** Datos de cuenta para las páginas de perfil (name/email/whatsapp/fecha) — no incluye la contraseña, que nunca se lee en claro. */
export async function getMyAccount(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, whatsapp: true, username: true, referralCode: true, createdAt: true, isAdmin: true },
  });
}

/** Cambia el WhatsApp de la cuenta en sesión (cliente o proveedor). */
export async function updateWhatsapp(userId: string, whatsapp: string) {
  await prisma.user.update({ where: { id: userId }, data: { whatsapp } });
}
