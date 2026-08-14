"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProviderSchedule } from "@/lib/actions/provider.actions";

export function ProviderScheduleForm({
  initialOpensAt,
  initialClosesAt,
}: {
  initialOpensAt: string | null;
  initialClosesAt: string | null;
}) {
  const router = useRouter();
  const [opensAt, setOpensAt] = useState(initialOpensAt ?? "");
  const [closesAt, setClosesAt] = useState(initialClosesAt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await updateProviderSchedule({ opensAt, closesAt });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Abre a las" type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
        <Input label="Cierra a las" type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">
        Fuera de este horario, tus productos muestran &quot;Fuera de horario&quot; en vez de &quot;Comprar
        ahora&quot;. Deja ambos campos vacíos para atender las 24 horas.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Horario actualizado.</p>}
      <Button type="submit" isLoading={loading} className="self-start">
        Guardar horario
      </Button>
    </form>
  );
}
