"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { createReviewSchema } from "@/lib/validators/review.schema";
import type { ActionResult } from "./types";

export async function createReview(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const purchase = await prisma.purchase.findUnique({
    where: { id: parsed.data.purchaseId },
    include: { review: true },
  });

  if (!purchase || purchase.clienteId !== session.userId) {
    return { ok: false, error: "Compra no encontrada." };
  }
  if (purchase.review) {
    return { ok: false, error: "Ya dejaste una reseña para esta compra." };
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        productId: purchase.productId,
        providerId: purchase.providerId,
        clienteId: session.userId,
        purchaseId: purchase.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { providerId: purchase.providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.provider.update({
      where: { id: purchase.providerId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });

    return created;
  });

  return { ok: true, data: { id: review.id } };
}

export async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId },
    include: { cliente: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
