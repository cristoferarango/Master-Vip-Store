"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { encryptSecret, decryptSecret } from "@/lib/crypto/credentials";
import { slugifyUnique } from "@/lib/utils/slug";
import { productSchema, accountStockSchema, updateStockSchema } from "@/lib/validators/product.schema";
import { updateProviderProfileSchema, updateProviderPaymentSchema } from "@/lib/validators/provider.schema";
import { scheduleSchema } from "@/lib/validators/schedule.schema";
import { approvePurchaseRequestCore, rejectPurchaseRequestCore } from "./purchaseRequestCore";
import type { ActionResult } from "./types";

/** Devuelve el Provider del usuario en sesión, o null si no aplica. No exportada: los archivos "use server" solo pueden exportar funciones async, los helpers internos no cuentan. */
async function getSessionProvider() {
  const session = await getSession();
  if (!session || !session.providerId) return null;
  const provider = await prisma.provider.findUnique({ where: { userId: session.userId } });
  return provider;
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };
  if (provider.status !== "ACTIVO") return { ok: false, error: "Tu cuenta de proveedor aún no está activa." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const slug = slugifyUnique(parsed.data.name);
  const product = await prisma.product.create({
    data: { ...parsed.data, slug, providerId: provider.id },
  });

  return { ok: true, data: { id: product.id, slug: product.slug } };
}

export async function updateProduct(
  productId: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const existing = await prisma.product.findFirst({ where: { id: productId, providerId: provider.id } });
  if (!existing) return { ok: false, error: "Producto no encontrado." };

  await prisma.product.update({ where: { id: productId }, data: parsed.data });
  return { ok: true, data: { id: productId } };
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const existing = await prisma.product.findFirst({ where: { id: productId, providerId: provider.id } });
  if (!existing) return { ok: false, error: "Producto no encontrado." };

  await prisma.product.update({ where: { id: productId }, data: { isActive } });
  return { ok: true, data: { id: productId } };
}

export async function deleteProduct(productId: string): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const existing = await prisma.product.findFirst({ where: { id: productId, providerId: provider.id } });
  if (!existing) return { ok: false, error: "Producto no encontrado." };

  const soldCount = await prisma.accountStock.count({ where: { productId, status: "VENDIDA" } });
  if (soldCount > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: tiene cuentas ya vendidas con historial de compra. Desactívalo en su lugar.",
    };
  }

  await prisma.accountStock.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
  return { ok: true, data: { id: productId } };
}

export async function addStock(input: unknown): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = accountStockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, providerId: provider.id },
  });
  if (!product) return { ok: false, error: "Producto no encontrado." };

  if (product.type === "STOCK" && !parsed.data.password) {
    return { ok: false, error: "Ingresa la contraseña de la cuenta." };
  }

  const stock = await prisma.accountStock.create({
    data: {
      productId: product.id,
      usernameEncrypted: encryptSecret(parsed.data.username),
      passwordEncrypted: parsed.data.password ? encryptSecret(parsed.data.password) : null,
      extraInfoEncrypted: parsed.data.extraInfo ? encryptSecret(parsed.data.extraInfo) : null,
    },
  });

  return { ok: true, data: { id: stock.id } };
}

export async function updateStock(input: unknown): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = updateStockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const stock = await prisma.accountStock.findUnique({
    where: { id: parsed.data.stockId },
    include: { product: { select: { providerId: true, type: true } } },
  });
  if (!stock || stock.product.providerId !== provider.id) {
    return { ok: false, error: "No encontrado." };
  }
  if (stock.product.type === "STOCK" && !parsed.data.password) {
    return { ok: false, error: "Ingresa la contraseña de la cuenta." };
  }

  await prisma.accountStock.update({
    where: { id: parsed.data.stockId },
    data: {
      usernameEncrypted: encryptSecret(parsed.data.username),
      passwordEncrypted: parsed.data.password ? encryptSecret(parsed.data.password) : null,
      extraInfoEncrypted: parsed.data.extraInfo ? encryptSecret(parsed.data.extraInfo) : null,
    },
  });

  return { ok: true, data: { id: parsed.data.stockId } };
}

export async function deleteStock(stockId: string): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const stock = await prisma.accountStock.findUnique({
    where: { id: stockId },
    include: { product: { select: { providerId: true } } },
  });
  if (!stock || stock.product.providerId !== provider.id) {
    return { ok: false, error: "No encontrado." };
  }
  if (stock.status === "VENDIDA") {
    return { ok: false, error: "No se puede eliminar: esta cuenta ya fue vendida." };
  }

  await prisma.accountStock.delete({ where: { id: stockId } });
  return { ok: true, data: { id: stockId } };
}

export async function updateProviderProfile(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = updateProviderProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.provider.update({ where: { id: provider.id }, data: parsed.data });
  return { ok: true, data: { id: provider.id } };
}

/** Datos de pago del proveedor: su propio QR, número y nombre de Yape — a donde los clientes le pagan directo. */
export async function updateProviderPaymentInfo(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = updateProviderPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.provider.update({ where: { id: provider.id }, data: parsed.data });
  return { ok: true, data: { id: provider.id } };
}

/** Horario en el que este proveedor atiende — vacío en ambos campos = disponible todo el día. */
export async function updateProviderSchedule(input: unknown): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      opensAt: parsed.data.opensAt || null,
      closesAt: parsed.data.closesAt || null,
    },
  });
  return { ok: true, data: { id: provider.id } };
}

/**
 * El proveedor aprueba su propia venta — es a su Yape que le llegó el pago,
 * así que es quien de verdad puede confirmarlo (no el admin).
 */
export async function approveMyPurchaseRequest(requestId: string): Promise<ActionResult<{ purchaseId: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request || request.providerId !== provider.id) {
    return { ok: false, error: "Solicitud no encontrada." };
  }

  try {
    const session = await getSession();
    const purchaseId = await approvePurchaseRequestCore(requestId, session!.userId);
    return { ok: true, data: { purchaseId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al aprobar la compra." };
  }
}

export async function rejectMyPurchaseRequest(
  requestId: string,
  reason?: string
): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request || request.providerId !== provider.id) {
    return { ok: false, error: "Solicitud no encontrada." };
  }

  try {
    const session = await getSession();
    await rejectPurchaseRequestCore(requestId, session!.userId, reason);
    return { ok: true, data: { id: requestId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al rechazar la compra." };
  }
}

/** Descifra bajo demanda una credencial de stock que le pertenece al proveedor en sesión. */
export async function revealStockCredentials(
  stockId: string
): Promise<ActionResult<{ username: string; password: string | null; extraInfo?: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const stock = await prisma.accountStock.findUnique({
    where: { id: stockId },
    include: { product: { select: { providerId: true } } },
  });
  if (!stock || stock.product.providerId !== provider.id) {
    return { ok: false, error: "No encontrado." };
  }

  return {
    ok: true,
    data: {
      username: decryptSecret(stock.usernameEncrypted),
      password: stock.passwordEncrypted ? decryptSecret(stock.passwordEncrypted) : null,
      extraInfo: stock.extraInfoEncrypted ? decryptSecret(stock.extraInfoEncrypted) : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Lecturas
//
// IMPORTANTE: cada función exportada de un archivo "use server" es su propio
// endpoint HTTP invocable directamente (así lo documenta Next.js), sin
// importar si la página que la usa está protegida por middleware. Por eso
// cada una vuelve a verificar la sesión y descarta cualquier userId/
// providerId recibido que no coincida — nunca se confía en el parámetro.
// ---------------------------------------------------------------------------

export async function getMyProviderProfile(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) return null;

  return prisma.provider.findUnique({ where: { userId } });
}

export async function getMyProducts(providerId: string) {
  const session = await getSession();
  if (!session || session.providerId !== providerId) return [];

  return prisma.product.findMany({
    where: { providerId },
    include: {
      category: { select: { name: true } },
      _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductForEdit(productId: string, providerId: string) {
  const session = await getSession();
  if (!session || session.providerId !== providerId) return null;

  return prisma.product.findFirst({ where: { id: productId, providerId } });
}

export async function getProductStock(productId: string, providerId: string) {
  const session = await getSession();
  if (!session || session.providerId !== providerId) return null;

  const product = await prisma.product.findFirst({ where: { id: productId, providerId } });
  if (!product) return null;
  const rows = await prisma.accountStock.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  // El proveedor es dueño de estas credenciales — se muestran directo, sin
  // botón de "revelar" (a diferencia de lo que ve un comprador o el admin).
  const stock = rows.map((s) => ({
    id: s.id,
    status: s.status,
    createdAt: s.createdAt,
    username: decryptSecret(s.usernameEncrypted),
    password: s.passwordEncrypted ? decryptSecret(s.passwordEncrypted) : null,
    extraInfo: s.extraInfoEncrypted ? decryptSecret(s.extraInfoEncrypted) : null,
  }));

  return { product, stock };
}

/** Solicitudes de compra pendientes de revisión para las cuentas de este proveedor. */
export async function getMyPendingPurchaseRequests(providerId: string) {
  const session = await getSession();
  if (!session || session.providerId !== providerId) return [];

  return prisma.purchaseRequest.findMany({
    where: { providerId, status: "PENDIENTE" },
    include: {
      cliente: { select: { name: true, whatsapp: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMySales(providerId: string) {
  const session = await getSession();
  if (!session || session.providerId !== providerId) return [];

  const purchases = await prisma.purchase.findMany({
    where: { providerId },
    include: {
      cliente: { select: { name: true, whatsapp: true } },
      product: { select: { name: true, type: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });

  // Igual que el stock: es su propia venta, se muestran las credenciales
  // entregadas directamente sin paso de "revelar".
  return purchases.map((p) => ({
    ...p,
    credentialUsername: decryptSecret(p.credentialUsernameEncrypted),
    credentialPassword: p.credentialPasswordEncrypted ? decryptSecret(p.credentialPasswordEncrypted) : null,
    credentialExtra: p.credentialExtraEncrypted ? decryptSecret(p.credentialExtraEncrypted) : null,
  }));
}

export async function getDashboardStats(providerId: string) {
  const session = await getSession();
  if (!session || session.providerId !== providerId) {
    return { totalSales: 0, salesThisMonth: 0, activeProducts: 0, totalEarnings: 0, earningsThisMonth: 0 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalSales, salesThisMonth, activeProducts, allPurchases] = await Promise.all([
    prisma.purchase.count({ where: { providerId } }),
    prisma.purchase.count({ where: { providerId, purchaseDate: { gte: startOfMonth } } }),
    prisma.product.count({ where: { providerId, isActive: true } }),
    prisma.purchase.findMany({ where: { providerId }, select: { pricePaid: true, purchaseDate: true } }),
  ]);

  const totalEarnings = allPurchases.reduce((sum, p) => sum + Number(p.pricePaid), 0);
  const earningsThisMonth = allPurchases
    .filter((p) => p.purchaseDate >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.pricePaid), 0);

  return { totalSales, salesThisMonth, activeProducts, totalEarnings, earningsThisMonth };
}
