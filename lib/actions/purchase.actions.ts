"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto/credentials";
import { addDays } from "@/lib/utils/dates";
import type { ActionResult } from "./types";
import type { PurchaseErrorCode } from "./purchase.types";

/**
 * Compra directa de una cuenta: valida saldo, toma un AccountStock
 * DISPONIBLE de forma atómica (evita doble venta), descuenta el wallet y
 * crea el Purchase con su propio snapshot cifrado.
 */
export async function purchaseProduct(
  productId: string
): Promise<ActionResult<{ purchaseId: string }> & { code?: PurchaseErrorCode }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Debes iniciar sesión.", code: "NOT_LOGGED_IN" };
  }

  try {
    const purchaseId = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) {
        throw new PurchaseError("Este producto ya no está disponible.", "PRODUCT_NOT_FOUND");
      }

      const wallet = await tx.wallet.upsert({
        where: { userId: session.userId },
        update: {},
        create: { userId: session.userId, balance: 0 },
      });

      if (Number(wallet.balance) < Number(product.price)) {
        throw new PurchaseError("No tienes saldo suficiente para esta compra.", "INSUFFICIENT_BALANCE");
      }

      // Toma el stock disponible más antiguo.
      const stock = await tx.accountStock.findFirst({
        where: { productId, status: "DISPONIBLE" },
        orderBy: { createdAt: "asc" },
      });
      if (!stock) {
        throw new PurchaseError("Esta cuenta se agotó justo ahora.", "OUT_OF_STOCK");
      }

      // Update condicional: si otra compra concurrente ya la marcó VENDIDA,
      // count será 0 y abortamos — evita vender la misma cuenta dos veces.
      const claim = await tx.accountStock.updateMany({
        where: { id: stock.id, status: "DISPONIBLE" },
        data: { status: "VENDIDA" },
      });
      if (claim.count === 0) {
        throw new PurchaseError("Esta cuenta se agotó justo ahora.", "OUT_OF_STOCK");
      }

      await tx.wallet.update({
        where: { userId: session.userId },
        data: { balance: { decrement: product.price } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "COMPRA",
          amount: Number(product.price) * -1,
          referenceId: product.id,
        },
      });

      const purchase = await tx.purchase.create({
        data: {
          clienteId: session.userId,
          providerId: product.providerId,
          productId: product.id,
          accountStockId: stock.id,
          pricePaid: product.price,
          expirationDate: addDays(new Date(), product.durationDays),
          credentialUsernameEncrypted: stock.usernameEncrypted,
          credentialPasswordEncrypted: stock.passwordEncrypted,
          credentialExtraEncrypted: stock.extraInfoEncrypted,
        },
      });

      return purchase.id;
    });

    return { ok: true, data: { purchaseId } };
  } catch (err) {
    if (err instanceof PurchaseError) {
      return { ok: false, error: err.message, code: err.code };
    }
    console.error("Error en purchaseProduct:", err);
    return { ok: false, error: "No se pudo completar la compra. Intenta de nuevo." };
  }
}

class PurchaseError extends Error {
  code: PurchaseErrorCode;
  constructor(message: string, code: PurchaseErrorCode) {
    super(message);
    this.code = code;
  }
}

/** Descifra bajo demanda las credenciales de una compra del cliente autenticado. */
export async function revealPurchaseCredentials(
  purchaseId: string
): Promise<ActionResult<{ username: string; password: string }>> {
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
      password: decryptSecret(purchase.credentialPasswordEncrypted),
    },
  };
}

/** Lecturas server-only para mis-compras / biblioteca. */
export async function getMyPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { clienteId: userId },
    include: {
      product: { select: { name: true, imageUrl: true, slug: true } },
      provider: { select: { businessName: true } },
      review: { select: { id: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });
}

export async function getMyActivePurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { clienteId: userId, status: "ACTIVA", expirationDate: { gt: new Date() } },
    include: {
      product: { select: { name: true, imageUrl: true, slug: true } },
      provider: { select: { businessName: true } },
    },
    orderBy: { expirationDate: "asc" },
  });
}
