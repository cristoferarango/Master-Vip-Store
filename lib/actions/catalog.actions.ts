import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Funciones de lectura del catálogo público. Se usan directamente desde
 * Server Components (no requieren "use server" porque no son mutaciones
 * invocadas desde el cliente).
 */

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true, provider: { status: "ACTIVO" } },
    include: {
      provider: { select: { businessName: true, ratingAvg: true, ratingCount: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      provider: { select: { businessName: true, ratingAvg: true, ratingCount: true, avatarUrl: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { stockItems: { where: { status: "DISPONIBLE" } } } },
    },
  });
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
