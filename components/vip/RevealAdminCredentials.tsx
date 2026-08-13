"use client";

import { useState } from "react";
import { Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { revealPurchaseCredentialsAdmin } from "@/lib/actions/admin.actions";

export function RevealAdminCredentials({ purchaseId }: { purchaseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ username: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleReveal() {
    setLoading(true);
    setError(null);
    const result = await revealPurchaseCredentialsAdmin(purchaseId);
    if (result.ok) setCreds(result.data);
    else setError(result.error);
    setLoading(false);
  }

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!creds) {
    return (
      <div className="flex flex-col gap-2">
        <Button onClick={handleReveal} isLoading={loading} className="w-fit gap-1.5">
          <Eye size={15} /> Revelar credenciales
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
        <p className="text-xs text-muted-foreground">Esta acción queda registrada en el servidor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Row label="Usuario" value={creds.username} copied={copied === "username"} onCopy={() => copy(creds.username, "username")} />
      {creds.password ? (
        <Row label="Contraseña" value={creds.password} copied={copied === "password"} onCopy={() => copy(creds.password!, "password")} />
      ) : (
        <p className="text-xs text-muted-foreground">Sin contraseña todavía — se coordina por WhatsApp (producto tipo Activación).</p>
      )}
    </div>
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
