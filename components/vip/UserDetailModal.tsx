"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getUserDetail } from "@/lib/actions/admin.actions";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";
import { formatOrderId } from "@/lib/utils/orderId";

type UserDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>;

export function UserDetailButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (detail) return;
    setLoading(true);
    const data = await getUserDetail(userId);
    setDetail(data);
    setLoading(false);
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={handleOpen}>
        Detalles
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={userName} className="max-h-[85vh] overflow-y-auto">
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-sm text-muted-foreground">Gastado en total</span>
              <span className="font-semibold text-foreground">
                {formatSoles(detail.purchases.reduce((sum, p) => sum + Number(p.pricePaid), 0))}
              </span>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Compras ({detail.purchases.length})
              </h3>
              {detail.purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin compras todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {detail.purchases.map((p) => (
                    <div key={p.id} className="rounded-xl border border-border bg-surface p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{p.productName}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <span className="font-semibold text-foreground">{formatSoles(p.pricePaid)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatOrderId(p.id)} · Proveedor: {p.providerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Compra: {formatDatePE(p.purchaseDate)} · Vence: {formatDatePE(p.expirationDate)}
                      </p>
                      <div className="mt-2 grid gap-1.5 border-t border-border pt-2 sm:grid-cols-3">
                        <CredField label="Usuario" value={p.credentialUsername} />
                        {p.credentialPassword ? (
                          <CredField label="Contraseña" value={p.credentialPassword} />
                        ) : (
                          <p className="self-end text-[11px] text-muted-foreground">Contraseña: se coordina por WhatsApp.</p>
                        )}
                        {p.credentialExtra && <CredField label="PIN / notas" value={p.credentialExtra} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function CredField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <span className="select-all truncate rounded-md border border-border bg-background-elevated px-2 py-1 font-mono text-[11px] text-foreground">
        {value}
      </span>
    </div>
  );
}
