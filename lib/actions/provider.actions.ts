"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { encryptSecret, decryptSecret } from "@/lib/crypto/credentials";
import { slugifyUnique } from "@/lib/utils/slug";
import { productSchema, accountStockSchema } from "@/lib/validators/product.schema";
import { updateProviderProfileSchema } from "@/lib/validators/provider.schema";
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

export async function addStock(input: unknown): Promise<ActionResult<{ id: string }>> {
  const provider = await getSessionProvider();
  if (!provider) return { ok: false, error: "No autorizado." };

  const parsed = accountStockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, providerId: provider.id },
  });
  if (!product) return { ok: false, error: "Producto no encontrado." };

  const stock = await prisma.accountStock.create({
    data: {
      productId: product.id,
      usernameEncrypted: encryptSecret(parsed.data.username),
      passwordEncrypted: encryptSecret(parsed.data.password),
      extraInfoEncrypted: parsed.data.extraInfo ? encryptSecret(parsed.data.extraInfo) : null,
    },
  });

  return { ok: true, data: { id: stock.id } };
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

/** Descifra bajo demanda una credencial de stock que le pertenece al proveedor en sesión. */
export async function revealStockCredentials(
  stockId: string
): Promise<ActionResult<{ username: string; password: string; extraInfo?: string }>> {
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
      password: decryptSecret(stock.passwordEncrypted),
      extraInfo: stock.extraInfoEncrypted ? decryptSecret(stock.extraInfoEncrypted) : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export async function getMyProviderProfile(userId: string) {
  return prisma.provider.findUnique({ where: { userId } });
}

export async function getMyProducts(providerId: string) {
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
  return prisma.product.findFirst({ where: { id: productId, providerId } });
}

export async function getProductStock(productId: string, providerId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, providerId } });
  if (!product) return null;
  const stock = await prisma.accountStock.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
  return { product, stock };
}

export async function getMySales(providerId: string) {
  return prisma.purchase.findMany({
    where: { providerId },
    include: {
      cliente: { select: { name: true, whatsapp: true } },
      product: { select: { name: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });
}

export async function getDashboardStats(providerId: string) {
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
