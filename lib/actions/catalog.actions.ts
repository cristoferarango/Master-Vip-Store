import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getPlatformSettings } from "./admin.actions";
import { isWithinSchedule, nowInLima } from "@/lib/utils/schedule";
import { effectivePrice, isViewerActiveSeller } from "./pricing";

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

  // Una sola lectura del horario de plataforma y del estado de seller para todos los productos.
  const [platform, sellerActive] = await Promise.all([getPlatformSettings(), isViewerActiveSeller()]);
  const now = nowInLima();
  return products.map((p) => ({
    ...p,
    price: effectivePrice(p, sellerActive),
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

  const sellerActive = await isViewerActiveSeller();
  return {
    ...product,
    price: effectivePrice(product, sellerActive),
    isOpenNow: await computeIsOpenNow(product.provider),
  };
}

/** Búsqueda por nombre de producto (barra de búsqueda del Navbar) — mismo shape que getActiveProducts. */
export async function searchProducts(query: string) {
  const q = query.trim();
  if (!q) return [];

  const products = await prisma.product.findMany({
    where: { isActive: true, provider: { status: "ACTIVO" }, name: { contains: q } },
    include: {
      provider: { select: { businessName: true, ratingAvg: true, ratingCount: true, opensAt: true, closesAt: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [platform, sellerActive] = await Promise.all([getPlatformSettings(), isViewerActiveSeller()]);
  const now = nowInLima();
  return products.map((p) => ({
    ...p,
    price: effectivePrice(p, sellerActive),
    isOpenNow:
      isWithinSchedule(platform.opensAt, platform.closesAt, now) &&
      isWithinSchedule(p.provider.opensAt, p.provider.closesAt, now),
  }));
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
