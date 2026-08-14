"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { decryptSecret, encryptSecret } from "@/lib/crypto/credentials";
import { createPurchaseRequestSchema } from "@/lib/validators/purchaseRequest.schema";
import { sendNotification } from "@/lib/notifications/notify";
import { formatSoles } from "@/lib/utils/currency";
import { isWithinSchedule, nowInLima } from "@/lib/utils/schedule";
import { effectivePrice, isViewerActiveSeller } from "./pricing";
import { getPlatformSettings } from "./admin.actions";
import type { ActionResult } from "./types";

/** Datos para el checkout: precio (ya el que le toca a este visitante), tipo de producto y el Yape propio del proveedor. */
export async function getCheckoutInfo(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      price: true,
      priceSeller: true,
      pricePromo: true,
      type: true,
      activacion2RequestsPassword: true,
      provider: {
        select: {
          businessName: true,
          yapeNumber: true,
          yapeName: true,
          yapeQrUrl: true,
          user: { select: { whatsapp: true } },
        },
      },
    },
  });
  if (!product) return null;

  const sellerActive = await isViewerActiveSeller();

  return {
    productName: product.name,
    price: effectivePrice(product, sellerActive).toString(),
    productType: product.type,
    activacion2RequestsPassword: product.activacion2RequestsPassword,
    providerName: product.provider.businessName,
    providerWhatsapp: product.provider.user.whatsapp,
    yapeNumber: product.provider.yapeNumber,
    yapeName: product.provider.yapeName,
    yapeQrUrl: product.provider.yapeQrUrl,
  };
}

/**
 * Solicita la compra de una cuenta: aparta un AccountStock disponible de
 * forma atómica (evita doble venta) y crea una PurchaseRequest PENDIENTE
 * con la captura del pago Yape hecho directo al proveedor. El admin la
 * revisa desde el Panel VIP — recién al aprobarla se crea el Purchase real
 * con las credenciales (ver admin.actions.ts::approvePurchaseRequest).
 */
export async function createPurchaseRequest(
  input: unknown
): Promise<ActionResult<{ requestId: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Debes iniciar sesión." };

  const parsed = createPurchaseRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const platform = await getPlatformSettings();
    const sellerActive = await isViewerActiveSeller();

    const { requestId, providerUserId, productName, amount } = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: parsed.data.productId },
        include: { provider: { select: { opensAt: true, closesAt: true } } },
      });
      if (!product || !product.isActive) {
        throw new Error("Este producto ya no está disponible.");
      }
      const now = nowInLima();
      if (!isWithinSchedule(platform.opensAt, platform.closesAt, now) || !isWithinSchedule(product.provider.opensAt, product.provider.closesAt, now)) {
        throw new Error("Este proveedor está fuera de su horario de atención ahora mismo.");
      }
      if ((product.type === "ACTIVACION" || product.type === "ACTIVACION2") && !parsed.data.clientEmail) {
        throw new Error("Ingresa el correo donde se activará el servicio.");
      }
      if (product.type === "ACTIVACION2" && product.activacion2RequestsPassword && !parsed.data.clientPassword) {
        throw new Error("Este producto requiere que ingreses también la contraseña de tu cuenta.");
      }

      const stock = await tx.accountStock.findFirst({
        where: { productId: product.id, status: "DISPONIBLE" },
        orderBy: { createdAt: "asc" },
      });
      if (!stock) throw new Error("Esta cuenta se agotó justo ahora.");

      // Update condicional: si otra solicitud concurrente ya la reservó,
      // count será 0 y abortamos — evita que dos clientes aparten la misma cuenta.
      const claim = await tx.accountStock.updateMany({
        where: { id: stock.id, status: "DISPONIBLE" },
        data: { status: "RESERVADA" },
      });
      if (claim.count === 0) throw new Error("Esta cuenta se agotó justo ahora.");

      const isActivation = product.type === "ACTIVACION" || product.type === "ACTIVACION2";
      const request = await tx.purchaseRequest.create({
        data: {
          clienteId: session.userId,
          providerId: product.providerId,
          productId: product.id,
          accountStockId: stock.id,
          amount: effectivePrice(product, sellerActive),
          screenshotUrl: parsed.data.screenshotUrl,
          operationCode: parsed.data.operationCode,
          clientEmail: isActivation ? parsed.data.clientEmail : undefined,
          clientPasswordEncrypted:
            product.type === "ACTIVACION2" && parsed.data.clientPassword
              ? encryptSecret(parsed.data.clientPassword)
              : undefined,
        },
      });

      const provider = await tx.provider.findUnique({
        where: { id: product.providerId },
        select: { userId: true },
      });

      return {
        requestId: request.id,
        providerUserId: provider?.userId,
        productName: product.name,
        amount: product.price.toString(),
      };
    });

    if (providerUserId) {
      await sendNotification({
        userId: providerUserId,
        type: "SOLICITUD_COMPRA_NUEVA",
        title: "Nueva solicitud de compra",
        message: `${session.name} quiere comprarte "${productName}" por ${formatSoles(amount)}. Revisa tu Yape y aprueba la solicitud.`,
      });
    }

    return { ok: true, data: { requestId } };
  } catch (err) {
    console.error("Error en createPurchaseRequest:", err);
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo enviar tu solicitud." };
  }
}

/** Descifra bajo demanda las credenciales de una compra del cliente autenticado. */
export async function revealPurchaseCredentials(
  purchaseId: string
): Promise<ActionResult<{ username: string; password: string | null }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "No autenticado." };

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase || purchase.clienteId !== session.userId) {
    return { ok: false, error: "Compra no encontrada." };
  }

  return {
    ok: true,
    data: {
      username: decryptSecret(purchase.credentialUsernameEncrypted),
      password: purchase.credentialPasswordEncrypted ? decryptSecret(purchase.credentialPasswordEncrypted) : null,
    },
  };
}

/**
 * Lecturas para mis-compras / biblioteca. Cada función exportada de un
 * archivo "use server" es su propio endpoint invocable directamente, así
 * que se re-verifica la sesión aquí y se ignora cualquier userId que no sea
 * el propio — nunca se confía en el parámetro recibido.
 */
export async function getMyPurchases(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return [];

  return prisma.purchase.findMany({
    where: { clienteId: userId },
    include: {
      product: { select: { name: true, imageUrl: true, slug: true, type: true } },
      provider: { select: { businessName: true, user: { select: { whatsapp: true } } } },
      review: { select: { id: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });
}

export async function getMyActivePurchases(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return [];

  return prisma.purchase.findMany({
    where: { clienteId: userId, status: "ACTIVA", expirationDate: { gt: new Date() } },
    include: {
      product: { select: { name: true, imageUrl: true, slug: true } },
      provider: { select: { businessName: true } },
    },
    orderBy: { expirationDate: "asc" },
  });
}

/** Solicitudes pendientes o rechazadas del cliente — se muestran junto a las compras aprobadas en "Mis compras". */
export async function getMyPurchaseRequests(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return [];

  return prisma.purchaseRequest.findMany({
    where: { clienteId: userId, status: { in: ["PENDIENTE", "RECHAZADO"] } },
    include: {
      product: { select: { name: true, imageUrl: true, slug: true, type: true } },
      provider: { select: { businessName: true, user: { select: { whatsapp: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}
