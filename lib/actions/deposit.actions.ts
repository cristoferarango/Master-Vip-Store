"use server";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { createDepositRequestSchema, type CreateDepositRequestInput } from "@/lib/validators/deposit.schema";
import type { ActionResult } from "./types";

/**
 * El cliente reporta un depósito Yape ya realizado. Queda PENDIENTE hasta
 * que el admin lo apruebe desde el Panel VIP (Fase 4) — recién ahí se
 * acredita el saldo. Ver lib/actions/admin.actions.ts::approveDeposit.
 */
export async function createDepositRequest(
  input: CreateDepositRequestInput
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Debes iniciar sesión para recargar saldo." };
  }

  const parsed = createDepositRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const deposit = await prisma.depositRequest.create({
    data: {
      clienteId: session.userId,
      amount: parsed.data.amount,
      operationCode: parsed.data.operationCode,
      screenshotUrl: parsed.data.screenshotUrl,
      status: "PENDIENTE",
    },
  });

  return { ok: true, data: { id: deposit.id } };
}

/** Lectura server-only para mostrar el historial de solicitudes del cliente actual. */
export async function getMyDepositRequests(userId: string) {
  return prisma.depositRequest.findMany({
    where: { clienteId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
