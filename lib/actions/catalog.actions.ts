import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getPlatformSettings } from "./admin.actions";
import { isWithinSchedule, nowInLima } from "@/lib/utils/schedule";

/**
 * Funciones de lectura del catálogo público. Se usan directamente desde
 * Server Components (no requieren "use server" porque no son mutaciones
 * invocadas desde el cliente).
 */

/** true si tanto la plataforma como el proveedor están dentro de su horario ahora mismo. */
async function computeIsOpenNow(provider: { opensAt: string | null; closesAt: string | null }): Promise<boolean> {
  const platform = await getPlatformSettings();
  const now = nowInLima();
  return isWithinSchedule(platform.opensAt, platform.closesAt, now) && isWithinSchedule(provider.opensAt, provider.closesAt, now);
}

export async function getActiveProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true, provider: { status: "ACTIVO" } },
    include: {
      provider: { select: { businessName: true, ratingAvg: true, ratingCount: true, opensAt: true, closesAt: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Una sola lectura del horario de plataforma para todos los productos, en vez de una por producto.
  const platform = await getPlatformSettings();
  const now = nowInLima();
  return products.map((p) => ({
    ...p,
    isOpenNow:
      isWithinSchedule(platform.opensAt, platform.closesAt, now) &&
      isWithinSchedule(p.provider.opensAt, p.provider.closesAt, now),
  }));
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      provider: { select: { businessName: true, ratingAvg: true, ratingCount: true, avatarUrl: true, opensAt: true, closesAt: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } },
    },
  });
  if (!product) return null;

  return { ...product, isOpenNow: await computeIsOpenNow(product.provider) };
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
}

/** Categorías con la cantidad de productos activos — para la vitrina de plataformas (Biblioteca). */
export async function getCategoriesWithProductCount() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { products: { where: { isActive: true, provider: { status: "ACTIVO" } } } } },
    },
  });
}
