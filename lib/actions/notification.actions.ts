"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "./types";

/**
 * Cada función exportada de un archivo "use server" es su propio endpoint
 * invocable directamente — se re-verifica la sesión en todas y se ignora
 * cualquier userId que no sea el propio, nunca se confía en el parámetro.
 */

export async function getMyNotifications(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return [];

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return 0;

  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "No autenticado." };

  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  return { ok: true, data: undefined };
}

/**
 * El panel de Proveedores solo debe avisar de una cosa: alguien quiere
 * comprarle una cuenta (nueva PurchaseRequest esperando su aprobación).
 * Se filtra por tipo — así no se mezcla con las notificaciones que la
 * misma cuenta recibe como cliente (COMPRA_APROBADA, etc.).
 */
export async function getMyProviderPurchaseNotifications(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return [];

  return prisma.notification.findMany({
    where: { userId, type: "SOLICITUD_COMPRA_NUEVA" },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}

export async function getUnreadProviderPurchaseNotificationCount(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return 0;

  return prisma.notification.count({
    where: { userId, type: "SOLICITUD_COMPRA_NUEVA", isRead: false },
  });
}

/** Marca leídas solo las notificaciones de "nueva solicitud de compra" — no toca las demás. */
export async function markProviderPurchaseNotificationsRead(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "No autenticado." };

  await prisma.notification.updateMany({
    where: { userId: session.userId, type: "SOLICITUD_COMPRA_NUEVA", isRead: false },
    data: { isRead: true },
  });

  return { ok: true, data: undefined };
}
