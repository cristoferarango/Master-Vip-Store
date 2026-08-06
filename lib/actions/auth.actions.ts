import "server-only";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { sendNotification } from "@/lib/notifications/notify";
import type { RegisterClientInput, RegisterProviderInput, LoginInput } from "@/lib/validators/auth.schema";

export class AuthError extends Error {}

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

    await prisma.wallet.upsert({
      where: { userId: existing.id },
      update: {},
      create: { userId: existing.id, balance: 0 },
    });

    return loginExistingUser(existing.id);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      whatsapp: input.whatsapp,
      role: "CLIENTE",
      wallet: { create: { balance: 0 } },
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
    message: "Ya puedes explorar el catálogo y recargar saldo por Yape para tu primera compra.",
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

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      whatsapp: input.whatsapp,
      role: "PROVEEDOR",
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
    where: { email: input.email },
    include: { providerProfile: true },
  });
  if (!user) throw new AuthError("Correo o contraseña incorrectos.");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new AuthError("Correo o contraseña incorrectos.");

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
