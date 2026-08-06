import "server-only";
import { prisma } from "@/lib/db/prisma";

/** Lecturas de wallet — se usan directamente desde Server Components. */

export async function getWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}

export async function getWalletTransactions(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return [];
  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
