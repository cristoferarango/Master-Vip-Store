"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { approveDeposit, rejectDeposit } from "@/lib/actions/admin.actions";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export interface DepositRow {
  id: string;
  amount: string;
  operationCode: string | null;
  screenshotUrl: string | null;
  createdAt: Date;
  cliente: { name: string; email: string; whatsapp: string };
}

export function DepositApprovalTable({ deposits }: { deposits: DepositRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await approveDeposit(id);
      setBusyId(null);
      router.refresh();
    });
  }

  function handleReject(id: string) {
    const reason = window.prompt("Motivo del rechazo (opcional):") ?? undefined;
    setBusyId(id);
    startTransition(async () => {
      await rejectDeposit(id, reason);
      setBusyId(null);
      router.refresh();
    });
  }

  if (deposits.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay depósitos pendientes. 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {deposits.map((d) => (
        <div key={d.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{d.cliente.name}</p>
            <p className="text-xs text-muted-foreground">
              {d.cliente.whatsapp} · {formatDatePE(d.createdAt)}
              {d.operationCode ? ` · Op: ${d.operationCode}` : ""}
            </p>
            {d.screenshotUrl && (
              <a
                href={d.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-accent hover:underline"
              >
                Ver captura
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground">{formatSoles(d.amount)}</span>
            <Button
              size="sm"
              isLoading={isPending && busyId === d.id}
              onClick={() => handleApprove(d.id)}
            >
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="danger"
              isLoading={isPending && busyId === d.id}
              onClick={() => handleReject(d.id)}
            >
              Rechazar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
