"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto/credentials";
import { hashPassword } from "@/lib/auth/password";
import { sendNotification } from "@/lib/notifications/notify";
import { updateAccountSchema } from "@/lib/validators/admin.schema";
import { scheduleSchema } from "@/lib/validators/schedule.schema";
import { approvePurchaseRequestCore, rejectPurchaseRequestCore } from "./purchaseRequestCore";
import type { ActionResult } from "./types";
import type { ProviderStatus } from "@prisma/client";

/** Solo cuentas con isAdmin=true pueden llamar estas acciones. */
async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || !session.isAdmin) return null;
  return session;
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

export async function toggleProviderStatus(
  providerId: string,
  newStatus: ProviderStatus
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: {
      status: newStatus,
      activatedAt: newStatus === "ACTIVO" ? new Date() : undefined,
    },
  });

  if (newStatus === "ACTIVO") {
    await sendNotification({
      userId: provider.userId,
      type: "PROVEEDOR_ACTIVADO",
      title: "¡Tu cuenta de proveedor fue activada!",
      message: "Ya puedes publicar productos y empezar a vender en Master Vip Store.",
    });
  }

  return { ok: true, data: { id: provider.id } };
}

/** Edita correo/whatsapp de cualquier cuenta y, opcionalmente, resetea su contraseña. */
export async function updateUserAccount(
  userId: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== userId) {
    return { ok: false, error: "Ese correo ya lo usa otra cuenta." };
  }

  const data: { email: string; whatsapp: string; passwordHash?: string } = {
    email: parsed.data.email,
    whatsapp: parsed.data.whatsapp,
  };
  if (parsed.data.newPassword) {
    data.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  await prisma.user.update({ where: { id: userId }, data });
  return { ok: true, data: { id: userId } };
}

/** Otorga o retira la capacidad de proveedor de una cuenta existente. */
export async function setUserProviderRole(
  userId: string,
  makeProvider: boolean,
  businessName?: string
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { providerProfile: true } });
  if (!user) return { ok: false, error: "Cuenta no encontrada." };

  if (makeProvider) {
    if (user.providerProfile) return { ok: true, data: { id: userId } };
    await prisma.provider.create({
      data: {
        userId,
        businessName: businessName?.trim() || `${user.name} Store`,
        status: "ACTIVO",
        activatedAt: new Date(),
      },
    });
    await sendNotification({
      userId,
      type: "PROVEEDOR_ACTIVADO",
      title: "¡Ahora también eres proveedor!",
      message: "El dueño activó tu cuenta de proveedor. Ya puedes publicar productos.",
    });
  } else {
    if (!user.providerProfile) return { ok: true, data: { id: userId } };
    try {
      await prisma.provider.delete({ where: { userId } });
    } catch {
      return {
        ok: false,
        error: "No se puede quitar el rol: tiene productos con ventas registradas.",
      };
    }
  }

  return { ok: true, data: { id: userId } };
}

/** Elimina una cuenta por completo. Falla con un mensaje claro si tiene compras/ventas registradas (se conservan por integridad del historial). */
export async function deleteUserAccount(userId: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  if (userId === admin.userId) return { ok: false, error: "No puedes eliminar tu propia cuenta." };

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    return {
      ok: false,
      error: "No se puede eliminar: la cuenta tiene compras o ventas registradas en el historial.",
    };
  }

  return { ok: true, data: { id: userId } };
}

/**
 * Aprobación de RESPALDO desde el Panel VIP — el flujo normal es que el
 * proveedor apruebe sus propias ventas (ver provider.actions.ts), ya que es
 * a su Yape que le llegó el pago. El dueño puede usar esto para supervisar
 * o resolver casos puntuales.
 */
export async function approvePurchaseRequest(requestId: string): Promise<ActionResult<{ purchaseId: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  try {
    const purchaseId = await approvePurchaseRequestCore(requestId, admin.userId);
    return { ok: true, data: { purchaseId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al aprobar la compra." };
  }
}

/** Rechazo de respaldo desde el Panel VIP (ver nota en approvePurchaseRequest). */
export async function rejectPurchaseRequest(
  requestId: string,
  reason?: string
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  try {
    await rejectPurchaseRequestCore(requestId, admin.userId, reason);
    return { ok: true, data: { id: requestId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al rechazar la compra." };
  }
}

/** Revela credenciales de cualquier compra. Queda registrado en logs del servidor (auditoría mínima). */
export async function revealPurchaseCredentialsAdmin(
  purchaseId: string
): Promise<ActionResult<{ username: string; password: string | null }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { ok: false, error: "Compra no encontrada." };

  console.log(`[audit] admin ${admin.email} reveló credenciales de purchase=${purchaseId}`);

  return {
    ok: true,
    data: {
      username: decryptSecret(purchase.credentialUsernameEncrypted),
      password: purchase.credentialPasswordEncrypted ? decryptSecret(purchase.credentialPasswordEncrypted) : null,
    },
  };
}

/**
 * Revisa manualmente qué cuentas activas vencen en los próximos 3 días y
 * les envía una notificación a sus dueños. Disparado a mano desde el Panel
 * VIP (no hay cron real todavía — ver TODO en lib/notifications/notify.ts).
 */
export async function checkExpiringPurchases(): Promise<ActionResult<{ notified: number }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const now = new Date();
  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);

  const expiringSoon = await prisma.purchase.findMany({
    where: { status: "ACTIVA", expirationDate: { gte: now, lte: in3Days } },
    include: { product: { select: { name: true } } },
  });

  for (const purchase of expiringSoon) {
    await sendNotification({
      userId: purchase.clienteId,
      type: "CUENTA_POR_VENCER",
      title: `Tu cuenta de ${purchase.product.name} está por vencer`,
      message: `Vence el ${purchase.expirationDate.toLocaleDateString("es-PE")}. Recárgala a tiempo para no perder el acceso.`,
    });
  }

  await prisma.purchase.updateMany({
    where: { status: "ACTIVA", expirationDate: { lt: now } },
    data: { status: "VENCIDA" },
  });

  return { ok: true, data: { notified: expiringSoon.length } };
}

// ---------------------------------------------------------------------------
// Lecturas
//
// IMPORTANTE: cada función exportada de un archivo "use server" es su propio
// endpoint HTTP invocable directamente (así lo documenta Next.js) — no basta
// con que la página que las usa esté protegida por el middleware. Por eso
// TODAS, sin excepción, repiten el chequeo de admin aquí adentro.
// ---------------------------------------------------------------------------

export async function getAllUsers() {
  const admin = await requireAdmin();
  if (!admin) return [];

  // Todas las cuentas no-admin (una cuenta puede ser cliente y proveedor a la vez).
  return prisma.user.findMany({
    where: { isAdmin: false },
    include: {
      _count: { select: { purchases: true } },
      providerProfile: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Detalle de un cliente para el panel "Detalles" del admin: sus compras con
 * credenciales visibles. Se llama desde un componente cliente (RPC de
 * Server Action), así que el resultado debe ser serializable — sin
 * Decimal/passwordHash crudos.
 */
export async function getUserDetail(userId: string) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      purchases: {
        include: {
          product: { select: { name: true } },
          provider: { select: { businessName: true } },
        },
        orderBy: { purchaseDate: "desc" },
      },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    createdAt: user.createdAt,
    purchases: user.purchases.map((p) => ({
      id: p.id,
      productName: p.product.name,
      providerName: p.provider.businessName,
      purchaseDate: p.purchaseDate,
      expirationDate: p.expirationDate,
      status: p.status,
      pricePaid: p.pricePaid.toString(),
      credentialUsername: decryptSecret(p.credentialUsernameEncrypted),
      credentialPassword: p.credentialPasswordEncrypted ? decryptSecret(p.credentialPasswordEncrypted) : null,
      credentialExtra: p.credentialExtraEncrypted ? decryptSecret(p.credentialExtraEncrypted) : null,
    })),
  };
}

export async function getAllProviders() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.provider.findMany({
    include: {
      user: { select: { email: true, whatsapp: true, name: true } },
      _count: { select: { products: true, purchases: true } },
      purchases: { select: { pricePaid: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProviderDetail(providerId: string) {
  const admin = await requireAdmin();
  if (!admin) return null;

  return prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      user: true,
      products: {
        include: { _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } } },
      },
      purchases: {
        include: {
          cliente: { select: { id: true, name: true, whatsapp: true, email: true } },
          product: { select: { name: true } },
        },
        orderBy: { purchaseDate: "desc" },
      },
    },
  });
}

export async function getPendingPurchaseRequests() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.purchaseRequest.findMany({
    where: { status: "PENDIENTE" },
    include: {
      cliente: { select: { name: true, whatsapp: true } },
      product: { select: { name: true } },
      provider: { select: { businessName: true, yapeNumber: true, yapeName: true, yapeQrUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllPurchaseRequests() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.purchaseRequest.findMany({
    include: {
      cliente: { select: { name: true, email: true } },
      product: { select: { name: true } },
      provider: { select: { businessName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPurchaseDetailForAdmin(purchaseId: string) {
  const admin = await requireAdmin();
  if (!admin) return null;

  return prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      cliente: { select: { name: true, email: true, whatsapp: true } },
      provider: { select: { businessName: true } },
      product: { select: { name: true, imageUrl: true } },
    },
  });
}

export async function getAllPurchases() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.purchase.findMany({
    include: {
      cliente: { select: { name: true } },
      provider: { select: { businessName: true } },
      product: { select: { name: true } },
    },
    orderBy: { purchaseDate: "desc" },
    take: 200,
  });
}

export async function getPlatformStats() {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      totalUsers: 0,
      newUsersThisWeek: 0,
      totalProviders: 0,
      activeProviders: 0,
      pendingPurchaseRequests: 0,
      totalPurchases: 0,
      purchasesThisMonth: 0,
      totalRevenue: 0,
      revenueThisMonth: 0,
    };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalUsers,
    newUsersThisWeek,
    totalProviders,
    activeProviders,
    pendingPurchaseRequests,
    totalPurchases,
    purchasesThisMonth,
    allPurchases,
  ] = await Promise.all([
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.count({ where: { isAdmin: false, createdAt: { gte: startOfWeek } } }),
    prisma.provider.count(),
    prisma.provider.count({ where: { status: "ACTIVO" } }),
    prisma.purchaseRequest.count({ where: { status: "PENDIENTE" } }),
    prisma.purchase.count(),
    prisma.purchase.count({ where: { purchaseDate: { gte: startOfMonth } } }),
    prisma.purchase.findMany({ select: { pricePaid: true, purchaseDate: true } }),
  ]);

  const totalRevenue = allPurchases.reduce((sum, p) => sum + Number(p.pricePaid), 0);
  const revenueThisMonth = allPurchases
    .filter((p) => p.purchaseDate >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.pricePaid), 0);

  return {
    totalUsers,
    newUsersThisWeek,
    totalProviders,
    activeProviders,
    pendingPurchaseRequests,
    totalPurchases,
    purchasesThisMonth,
    totalRevenue,
    revenueThisMonth,
  };
}

// ---------------------------------------------------------------------------
// Horario general de la plataforma
// ---------------------------------------------------------------------------

/** Horario general de la tienda — se combina con el de cada proveedor (ver lib/utils/schedule.ts). */
export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function updatePlatformSettings(input: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const settings = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: { opensAt: parsed.data.opensAt || null, closesAt: parsed.data.closesAt || null },
    create: { id: "singleton", opensAt: parsed.data.opensAt || null, closesAt: parsed.data.closesAt || null },
  });
  return { ok: true, data: { id: settings.id } };
}
