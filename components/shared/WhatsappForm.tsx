"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function WhatsappForm({ initialWhatsapp }: { initialWhatsapp: string }) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/update-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar");
        return;
      }
      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input
        label="Número de celular (WhatsApp) — solo Perú"
        placeholder="9XXXXXXXX"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" isLoading={loading} className="sm:w-auto">
        Guardar
      </Button>
      {error && <p className="text-sm text-danger sm:ml-2">{error}</p>}
      {success && <p className="text-sm text-success sm:ml-2">Actualizado.</p>}
    </form>
  );
}
