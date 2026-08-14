import { prisma } from "@/lib/db/prisma";
import { sendNotification } from "@/lib/notifications/notify";

/**
 * Lógica real de "revisar vencimientos" — vive separada de admin.actions.ts
 * (que es "use server", así que CUALQUIER función que exporte queda como
 * endpoint invocable desde el cliente) para poder llamarla también desde
 * instrumentation.ts en un timer de fondo, sin exponerla nunca sin sesión de
 * admin. checkExpiringPurchases() en admin.actions.ts sigue siendo el único
 * punto de entrada para el botón manual del Panel Master, y valida sesión
 * antes de llamar acá.
 */
export async function runExpirationSweep(): Promise<{ notified: number }> {
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

  return { notified: expiringSoon.length };
}
