"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { approveMyPurchaseRequest, rejectMyPurchaseRequest } from "@/lib/actions/provider.actions";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export interface MyRequestRow {
  id: string;
  amount: string;
  operationCode: string | null;
  screenshotUrl: string;
  createdAt: Date;
  cliente: { name: string; whatsapp: string };
  product: { name: string };
}

export function MyPurchaseRequestsTable({ requests }: { requests: MyRequestRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await approveMyPurchaseRequest(id);
      setBusyId(null);
      router.refresh();
    });
  }

  function handleReject(id: string) {
    const reason = window.prompt("Motivo del rechazo (opcional):") ?? undefined;
    setBusyId(id);
    startTransition(async () => {
      await rejectMyPurchaseRequest(id, reason);
      setBusyId(null);
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No tienes solicitudes pendientes. 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer" className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background-elevated">
              <Image src={r.screenshotUrl} alt="Captura de pago" fill className="object-cover" />
            </a>
            <div>
              <p className="font-medium text-foreground">{r.product.name}</p>
              <p className="text-xs text-muted-foreground">Cliente: {r.cliente.name}</p>
              <a
                href={`https://wa.me/${r.cliente.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-success hover:underline"
              >
                <MessageCircle size={12} /> {r.cliente.whatsapp}
              </a>
              <p className="text-xs text-muted-foreground">
                {formatDatePE(r.createdAt)}
                {r.operationCode ? ` · Op: ${r.operationCode}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-lg font-bold text-foreground">{formatSoles(r.amount)}</span>
            <Button size="sm" isLoading={isPending && busyId === r.id} onClick={() => handleApprove(r.id)}>
              Aprobar
            </Button>
            <Button size="sm" variant="danger" isLoading={isPending && busyId === r.id} onClick={() => handleReject(r.id)}>
              Rechazar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
