"use client";

import { useState } from "react";
import { Eye, Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { revealPurchaseCredentials } from "@/lib/actions/purchase.actions";

export function RevealCredentials({
  purchaseId,
  productName,
  whatsappLink,
}: {
  purchaseId: string;
  productName: string;
  /** Si la compra es tipo Activación y el proveedor tiene WhatsApp, se muestra un botón para escribirle. */
  whatsappLink?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ username: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState<"username" | "password" | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (creds) return;
    setLoading(true);
    setError(null);
    const result = await revealPurchaseCredentials(purchaseId);
    if (result.ok) {
      setCreds(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  function copy(value: string, field: "username" | "password") {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={handleOpen} className="gap-1.5">
        <Eye size={14} /> Ver credenciales
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={productName}>
        {loading && <p className="text-sm text-muted-foreground">Descifrando credenciales...</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        {creds && (
          <div className="flex flex-col gap-3">
            <CredentialRow label="Usuario / correo" value={creds.username} copied={copied === "username"} onCopy={() => copy(creds.username, "username")} />
            {creds.password ? (
              <CredentialRow label="Contraseña" value={creds.password} copied={copied === "password"} onCopy={() => copy(creds.password!, "password")} />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-warning">
                  Esta cuenta se activa por WhatsApp: escríbele al proveedor con tu código de solicitud para que te
                  pase la contraseña cuando vayas a activarla.
                </p>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-feedback inline-flex items-center justify-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-primary to-primary-strong px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"
                  >
                    <MessageCircle size={14} /> Escribir por WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function CredentialRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <span className="select-all font-mono text-sm text-foreground">{value}</span>
        <button onClick={onCopy} aria-label={`Copiar ${label.toLowerCase()}`} className="text-muted-foreground hover:text-foreground">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
