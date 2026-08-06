"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createDepositRequest } from "@/lib/actions/deposit.actions";

export function DepositRequestForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [operationCode, setOperationCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let screenshotUrl: string | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "depositos");
        const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "No se pudo subir la captura");
          return;
        }
        screenshotUrl = uploadData.url;
      }

      const result = await createDepositRequest({
        amount: Number(amount),
        operationCode: operationCode || undefined,
        screenshotUrl,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
        Reportaste tu depósito correctamente. Quedará <strong>pendiente</strong> hasta que lo
        aprobemos — tu saldo se actualizará automáticamente apenas lo confirmemos.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Monto depositado (S/)"
        type="number"
        step="0.10"
        min="1"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="20.00"
      />
      <Input
        label="Código de operación Yape (opcional)"
        value={operationCode}
        onChange={(e) => setOperationCode(e.target.value)}
        placeholder="OP-000123"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Captura del pago (opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-strong file:px-3 file:py-1.5 file:text-foreground"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" isLoading={loading} className="mt-1">
        Reportar depósito
      </Button>
    </form>
  );
}
