import "server-only";
import { prisma } from "@/lib/db/prisma";
import { addDays } from "@/lib/utils/dates";
import { sendNotification } from "@/lib/notifications/notify";

/**
 * Lógica compartida de aprobar/rechazar una PurchaseRequest — la llaman
 * tanto admin.actions.ts (aprobación de respaldo/supervisión del dueño)
 * como provider.actions.ts (el proveedor aprueba su propia venta, que es
 * el flujo normal: es a su Yape que le llegó el pago). Cada llamador ya
 * validó el permiso antes de invocar esto — este módulo no vuelve a
 * chequear sesión/rol.
 */

export async function approvePurchaseRequestCore(
  requestId: string,
  reviewerUserId: string
): Promise<string> {
  const purchaseId = await prisma.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Solicitud no encontrada.");
    if (request.status !== "PENDIENTE") throw new Error("Esta solicitud ya fue procesada.");

    const stock = await tx.accountStock.findUnique({ where: { id: request.accountStockId } });
    if (!stock) throw new Error("La cuenta reservada ya no existe.");

    const product = await tx.product.findUnique({ where: { id: request.productId } });
    if (!product) throw new Error("Producto no encontrado.");

    await tx.accountStock.update({ where: { id: stock.id }, data: { status: "VENDIDA" } });

    const purchase = await tx.purchase.create({
      data: {
        clienteId: request.clienteId,
        providerId: request.providerId,
        productId: request.productId,
        accountStockId: stock.id,
        requestId: request.id,
        pricePaid: request.amount,
        expirationDate: addDays(new Date(), product.durationDays),
        clientEmail: request.clientEmail,
        credentialUsernameEncrypted: stock.usernameEncrypted,
        credentialPasswordEncrypted: stock.passwordEncrypted,
        credentialExtraEncrypted: stock.extraInfoEncrypted,
      },
    });

    await tx.purchaseRequest.update({
      where: { id: requestId },
      data: { status: "APROBADO", reviewedByAdminId: reviewerUserId, reviewedAt: new Date() },
    });

    return purchase.id;
  });

  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: { product: { select: { name: true } } },
  });
  if (request) {
    await sendNotification({
      userId: request.clienteId,
      type: "COMPRA_APROBADA",
      title: "¡Tu compra fue aprobada!",
      message: `Ya puedes ver las credenciales de ${request.product.name} en "Mis compras".`,
    });
  }

  return purchaseId;
}

export async function rejectPurchaseRequestCore(
  requestId: string,
  reviewerUserId: string,
  reason?: string
): Promise<void> {
  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Solicitud no encontrada.");
  if (request.status !== "PENDIENTE") throw new Error("Esta solicitud ya fue procesada.");

  await prisma.$transaction([
    prisma.accountStock.update({ where: { id: request.accountStockId }, data: { status: "DISPONIBLE" } }),
    prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: "RECHAZADO", reviewedByAdminId: reviewerUserId, reviewedAt: new Date(), rejectionReason: reason },
    }),
  ]);

  await sendNotification({
    userId: request.clienteId,
    type: "COMPRA_RECHAZADA",
    title: "Tu compra fue rechazada",
    message: reason ? `Motivo: ${reason}` : "No pudimos validar tu pago. Contáctanos por soporte.",
  });
}
