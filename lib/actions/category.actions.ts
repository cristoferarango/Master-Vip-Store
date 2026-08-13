"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validators/category.schema";
import { slugify, slugifyUnique } from "@/lib/utils/slug";
import type { ActionResult } from "./types";

/** Solo cuentas con isAdmin=true pueden administrar categorías. */
async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || !session.isAdmin) return null;
  return session;
}

/** Lista completa para el panel VIP — incluye categorías sin productos. */
export async function getAllCategoriesAdmin() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const existing = await prisma.category.findUnique({ where: { name: parsed.data.name } });
    if (existing) return { ok: false, error: "Ya existe una categoría con ese nombre." };

    const baseSlug = slugify(parsed.data.name);
    const slugTaken = await prisma.category.findUnique({ where: { slug: baseSlug } });
    const slug = slugTaken ? slugifyUnique(parsed.data.name) : baseSlug;

    const maxOrder = await prisma.category.aggregate({ _max: { order: true } });

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        icon: parsed.data.icon || null,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return { ok: true, data: { id: category.id } };
  } catch {
    return { ok: false, error: "No se pudo crear la categoría." };
  }
}

export async function updateCategory(categoryId: string, input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const duplicate = await prisma.category.findFirst({
      where: { name: parsed.data.name, NOT: { id: categoryId } },
    });
    if (duplicate) return { ok: false, error: "Ya existe una categoría con ese nombre." };

    await prisma.category.update({
      where: { id: categoryId },
      data: { name: parsed.data.name, icon: parsed.data.icon || null },
    });

    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo actualizar la categoría." };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const withProducts = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });
  if (!withProducts) return { ok: false, error: "Categoría no encontrada." };
  if (withProducts._count.products > 0) {
    return { ok: false, error: "Tiene productos asociados — muévelos o elimínalos antes de borrar la categoría." };
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo eliminar la categoría." };
  }
}
