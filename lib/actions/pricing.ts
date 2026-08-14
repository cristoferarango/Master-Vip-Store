import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";
type Decimal = Prisma.Decimal;

/** true si la cuenta en sesión es un seller ya activado por el dueño. */
export async function isViewerActiveSeller(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isSeller: true, sellerStatus: true },
  });
  return !!user?.isSeller && user.sellerStatus === "ACTIVO";
}

/**
 * Precio que le toca ver/pagar a ESTE visitante: Promoción le gana a todos
 * (si está puesta), si no, Seller (solo si el visitante es seller activo),
 * si no, el precio Normal.
 */
export function effectivePrice(
  p: { price: Decimal; priceSeller: Decimal | null; pricePromo: Decimal | null },
  sellerActive: boolean
): Decimal {
  if (p.pricePromo) return p.pricePromo;
  if (sellerActive && p.priceSeller) return p.priceSeller;
  return p.price;
}
