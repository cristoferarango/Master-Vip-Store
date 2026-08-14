"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { updateSiteContent } from "@/lib/actions/admin.actions";
import type { SiteContentInput } from "@/lib/validators/siteContent.schema";

export function SiteContentForm({ initial }: { initial: SiteContentInput }) {
  const router = useRouter();
  const [hubCards, setHubCards] = useState(initial.hubCards);
  const [streamingTitle, setStreamingTitle] = useState(initial.streamingTitle);
  const [streamingDescription, setStreamingDescription] = useState(initial.streamingDescription);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateCard(i: number, field: keyof (typeof hubCards)[number], value: string) {
    setHubCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await updateSiteContent({ hubCards, streamingTitle, streamingDescription });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  const cardLabels = ["Tarjeta 1 — Streaming", "Tarjeta 2 — Proveedores", "Tarjeta 3 — Master"];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {hubCards.map((card, i) => (
        <Card key={i}>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{cardLabels[i]}</h3>
          <div className="flex flex-col gap-3">
            <Input label="Título" required value={card.title} onChange={(e) => updateCard(i, "title", e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground/90">Descripción</label>
              <textarea
                required
                rows={2}
                value={card.description}
                onChange={(e) => updateCard(i, "description", e.target.value)}
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Input label="Texto del botón" required value={card.buttonLabel} onChange={(e) => updateCard(i, "buttonLabel", e.target.value)} />
            <ImageUploadField
              label="Ícono"
              value={card.iconUrl ?? ""}
              onChange={(url) => updateCard(i, "iconUrl", url)}
              folder="iconos"
              aspect="1/1"
              widthClass="w-20"
              buttonLabel="Subir ícono — 1000 x 1000"
              hint="SVG o PNG, 1000 x 1000 px. Si no subes uno, se usa el ícono por defecto."
            />
          </div>
        </Card>
      ))}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Encabezado de Streaming</h3>
        <div className="flex flex-col gap-3">
          <Input label="Título" required value={streamingTitle} onChange={(e) => setStreamingTitle(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/90">Descripción</label>
            <textarea
              required
              rows={2}
              value={streamingDescription}
              onChange={(e) => setStreamingDescription(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Guardado.</p>}
      <Button type="submit" isLoading={loading}>
        Guardar cambios
      </Button>
    </form>
  );
}
