"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { updateStock, deleteStock } from "@/lib/actions/provider.actions";
import { formatDatePE } from "@/lib/utils/dates";

export interface StockRowData {
  id: string;
  status: "DISPONIBLE" | "VENDIDA";
  createdAt: Date;
  username: string;
  password: string;
  extraInfo: string | null;
}

export function StockRow({ stock }: { stock: StockRowData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(stock.username);
  const [password, setPassword] = useState(stock.password);
  const [extraInfo, setExtraInfo] = useState(stock.extraInfo ?? "");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"save" | "delete" | null>(null);

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleSave() {
    setLoading("save");
    setError(null);
    const result = await updateStock({ stockId: stock.id, username, password, extraInfo: extraInfo || undefined });
    if (!result.ok) {
      setError(result.error);
      setLoading(null);
      return;
    }
    setEditing(false);
    setLoading(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta cuenta del stock?")) return;
    setLoading("delete");
    setError(null);
    const result = await deleteStock(stock.id);
    if (!result.ok) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2.5 py-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input label="Usuario/correo" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="PIN / notas" value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} isLoading={loading === "save"}>
            Guardar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <StatusBadge status={stock.status} />
          <span className="text-xs text-muted-foreground">Agregada {formatDatePE(stock.createdAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
          {stock.status === "DISPONIBLE" && (
            <Button size="sm" variant="danger" onClick={handleDelete} isLoading={loading === "delete"}>
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <CredField label="Usuario" value={stock.username} copied={copied === "user"} onCopy={() => copy(stock.username, "user")} />
        <CredField label="Contraseña" value={stock.password} copied={copied === "pass"} onCopy={() => copy(stock.password, "pass")} />
        {stock.extraInfo && (
          <CredField label="PIN / notas" value={stock.extraInfo} copied={copied === "extra"} onCopy={() => copy(stock.extraInfo!, "extra")} />
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function CredField({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
        <span className="select-all truncate font-mono text-xs text-foreground">{value}</span>
        <button onClick={onCopy} aria-label={`Copiar ${label.toLowerCase()}`} className="shrink-0 text-muted-foreground hover:text-foreground">
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}
