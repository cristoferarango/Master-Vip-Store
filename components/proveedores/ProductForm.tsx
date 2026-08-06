"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createProduct, updateProduct } from "@/lib/actions/provider.actions";

export interface ProductFormInitial {
  id?: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  description: string;
  conditions: string;
  price: string;
  durationDays: string;
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [conditions, setConditions] = useState(initial?.conditions ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [durationDays, setDurationDays] = useState(initial?.durationDays ?? "30");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImageChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "productos");
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir la imagen");
        return;
      }
      setImageUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!imageUrl) {
      setError("Sube una imagen del producto.");
      return;
    }

    setLoading(true);
    const input = { name, categoryId, imageUrl, description, conditions, price, durationDays };

    const result = isEdit
      ? await updateProduct(initial!.id!, input)
      : await createProduct(input);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/proveedores/dashboard/productos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre del producto" required value={name} onChange={(e) => setName(e.target.value)} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Categoría</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-background-elevated">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Imagen del producto</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-strong file:px-3 file:py-1.5 file:text-foreground"
        />
        {uploading && <p className="text-xs text-muted-foreground">Subiendo imagen...</p>}
        {imageUrl && (
          <div className="relative mt-1 h-28 w-40 overflow-hidden rounded-lg border border-border">
            <Image src={imageUrl} alt="Vista previa" fill className="object-cover" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Descripción</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Condiciones</label>
        <textarea
          required
          rows={3}
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="Ej: no compartir la cuenta, no cambiar la contraseña..."
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Precio (S/)"
          type="number"
          step="0.10"
          min="0.10"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Input
          label="Vigencia (días)"
          type="number"
          min="1"
          required
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" isLoading={loading} className="mt-1">
        {isEdit ? "Guardar cambios" : "Publicar producto"}
      </Button>
    </form>
  );
}
