"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "./types";

export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}

export async function getUnreadNotificationCount(userId: string) {
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
