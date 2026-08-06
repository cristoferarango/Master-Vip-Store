"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto/credentials";
import { sendNotification } from "@/lib/notifications/notify";
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

export async function approveDeposit(depositId: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  try {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.depositRequest.findUnique({ where: { id: depositId } });
      if (!deposit) throw new Error("Solicitud no encontrada.");
      if (deposit.status !== "PENDIENTE") throw new Error("Esta solicitud ya fue procesada.");

      const wallet = await tx.wallet.upsert({
        where: { userId: deposit.clienteId },
        update: {},
        create: { userId: deposit.clienteId, balance: 0 },
      });

      await tx.wallet.update({
        where: { userId: deposit.clienteId },
        data: { balance: { increment: deposit.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "RECARGA",
          amount: Number(deposit.amount),
          referenceId: deposit.id,
        },
      });

      await tx.depositRequest.update({
        where: { id: depositId },
        data: { status: "APROBADO", reviewedByAdminId: admin.userId, reviewedAt: new Date() },
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al aprobar el depósito." };
  }

  const deposit = await prisma.depositRequest.findUnique({ where: { id: depositId } });
  if (deposit) {
    await sendNotification({
      userId: deposit.clienteId,
      type: "DEPOSITO_APROBADO",
      title: "Tu recarga fue aprobada",
      message: `Se acreditaron S/ ${deposit.amount.toString()} a tu saldo.`,
    });
  }

  return { ok: true, data: { id: depositId } };
}

export async function rejectDeposit(
  depositId: string,
  reason?: string
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const deposit = await prisma.depositRequest.update({
    where: { id: depositId },
    data: {
      status: "RECHAZADO",
      reviewedByAdminId: admin.userId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });

  await sendNotification({
    userId: deposit.clienteId,
    type: "DEPOSITO_RECHAZADO",
    title: "Tu recarga fue rechazada",
    message: reason ? `Motivo: ${reason}` : "No pudimos validar tu depósito. Contáctanos por soporte.",
  });

  return { ok: true, data: { id: depositId } };
}

/** Revela credenciales de cualquier compra. Queda registrado en logs del servidor (auditoría mínima). */
export async function revealPurchaseCredentialsAdmin(
  purchaseId: string
): Promise<ActionResult<{ username: string; password: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { ok: false, error: "Compra no encontrada." };

  console.log(`[audit] admin ${admin.email} reveló credenciales de purchase=${purchaseId}`);

  return {
    ok: true,
    data: {
      username: decryptSecret(purchase.credentialUsernameEncrypted),
      password: decryptSecret(purchase.credentialPasswordEncrypted),
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
// ---------------------------------------------------------------------------

export async function getAllUsers() {
  // Todas las cuentas no-admin (una cuenta puede ser cliente y proveedor a la vez).
  return prisma.user.findMany({
    where: { isAdmin: false },
    include: { wallet: true, _count: { select: { purchases: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllProviders() {
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
  return prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      user: true,
      products: {
        include: { _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } } },
      },
      purchases: {
        include: {
          cliente: { select: { name: true, whatsapp: true } },
          product: { select: { name: true } },
        },
        orderBy: { purchaseDate: "desc" },
      },
    },
  });
}

export async function getPendingDeposits() {
  return prisma.depositRequest.findMany({
    where: { status: "PENDIENTE" },
    include: { cliente: { select: { name: true, email: true, whatsapp: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllDeposits() {
  return prisma.depositRequest.findMany({
    include: { cliente: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPurchaseDetailForAdmin(purchaseId: string) {
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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalUsers,
    newUsersThisWeek,
    totalProviders,
    activeProviders,
    pendingDeposits,
    totalPurchases,
    purchasesThisMonth,
    allPurchases,
  ] = await Promise.all([
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.count({ where: { isAdmin: false, createdAt: { gte: startOfWeek } } }),
    prisma.provider.count(),
    prisma.provider.count({ where: { status: "ACTIVO" } }),
    prisma.depositRequest.count({ where: { status: "PENDIENTE" } }),
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
    pendingDeposits,
    totalPurchases,
    purchasesThisMonth,
    totalRevenue,
    revenueThisMonth,
  };
}
