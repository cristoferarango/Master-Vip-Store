"use client";

import { useState } from "react";
import { Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { revealStockCredentials } from "@/lib/actions/provider.actions";

export function RevealStockCredentials({ stockId }: { stockId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ username: string; password: string; extraInfo?: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (creds) return;
    setLoading(true);
    setError(null);
    const result = await revealStockCredentials(stockId);
    if (result.ok) setCreds(result.data);
    else setError(result.error);
    setLoading(false);
  }

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={handleOpen} className="gap-1.5">
        <Eye size={14} /> Ver
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Credenciales de la cuenta">
        {loading && <p className="text-sm text-muted-foreground">Descifrando...</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        {creds && (
          <div className="flex flex-col gap-3">
            <Row label="Usuario" value={creds.username} copied={copied === "username"} onCopy={() => copy(creds.username, "username")} />
            <Row label="Contraseña" value={creds.password} copied={copied === "password"} onCopy={() => copy(creds.password, "password")} />
            {creds.extraInfo && (
              <Row label="Notas" value={creds.extraInfo} copied={copied === "extra"} onCopy={() => copy(creds.extraInfo!, "extra")} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Row({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <span className="select-all break-all font-mono text-sm text-foreground">{value}</span>
        <button onClick={onCopy} aria-label={`Copiar ${label.toLowerCase()}`} className="shrink-0 text-muted-foreground hover:text-foreground">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
