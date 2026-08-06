"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProviderProfile } from "@/lib/actions/provider.actions";

export function ProviderProfileForm({
  initialBusinessName,
  initialBio,
  initialAvatarUrl,
}: {
  initialBusinessName: string;
  initialBio: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatares");
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir la foto");
        return;
      }
      setAvatarUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await updateProviderProfile({ businessName, bio, avatarUrl: avatarUrl || undefined });

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
      <div className="flex items-center gap-4">
        <Avatar name={businessName || "?"} src={avatarUrl} size={56} />
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-strong file:px-3 file:py-1.5 file:text-foreground"
          />
          {uploading && <p className="mt-1 text-xs text-muted-foreground">Subiendo...</p>}
        </div>
      </div>

      <Input
        label="Nombre de tu tienda"
        required
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Descripción (opcional)</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntale a tus clientes sobre tu tienda..."
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Perfil actualizado.</p>}
      <Button type="submit" isLoading={loading} className="mt-1 self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
