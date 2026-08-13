"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProviderPaymentInfo } from "@/lib/actions/provider.actions";

export function ProviderPaymentForm({
  initialYapeNumber,
  initialYapeName,
  initialYapeQrUrl,
}: {
  initialYapeNumber: string | null;
  initialYapeName: string | null;
  initialYapeQrUrl: string | null;
}) {
  const router = useRouter();
  const [yapeNumber, setYapeNumber] = useState(initialYapeNumber ?? "");
  const [yapeName, setYapeName] = useState(initialYapeName ?? "");
  const [yapeQrUrl, setYapeQrUrl] = useState(initialYapeQrUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleQrChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "yape-qr");
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir el QR");
        return;
      }
      setYapeQrUrl(data.url);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveQr() {
    setYapeQrUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await updateProviderPaymentInfo({ yapeNumber, yapeName, yapeQrUrl: yapeQrUrl || undefined });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Tus clientes pagan directo a este Yape cuando compran tus cuentas — sube tu QR real (opcional) para que
        no tengan que escribir el número a mano.
      </p>

      <Input
        label="Número de Yape"
        required
        placeholder="9XXXXXXXX"
        value={yapeNumber}
        onChange={(e) => setYapeNumber(e.target.value)}
      />

      <Input
        label="Nombre que sale en tu Yape"
        required
        placeholder="Como aparece al recibir el pago"
        value={yapeName}
        onChange={(e) => setYapeName(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Código QR de Yape (opcional)</label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleQrChange(e.target.files?.[0] ?? null)}
          className={
            yapeQrUrl
              ? "hidden"
              : "text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-strong file:px-3 file:py-1.5 file:text-foreground"
          }
        />
        {uploading && <p className="text-xs text-muted-foreground">Subiendo...</p>}

        {yapeQrUrl && (
          <div className="mt-1 flex items-start gap-3">
            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
              <Image src={yapeQrUrl} alt="Tu QR de Yape" fill className="object-contain p-2" />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <RefreshCw size={14} /> Reemplazar
              </Button>
              <Button type="button" size="sm" variant="danger" onClick={handleRemoveQr} className="gap-1.5">
                <Trash2 size={14} /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Datos de pago actualizados.</p>}
      <Button type="submit" isLoading={loading} className="mt-1 self-start">
        Guardar datos de pago
      </Button>
    </form>
  );
}
