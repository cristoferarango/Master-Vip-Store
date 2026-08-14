"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { createProduct, updateProduct } from "@/lib/actions/provider.actions";

export interface ProductFormInitial {
  id?: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  description: string;
  conditions: string;
  price: string;
  priceSeller?: string | null;
  pricePromo?: string | null;
  durationDays: string;
  type?: "STOCK" | "ACTIVACION" | "ACTIVACION2";
  activacion2RequestsPassword?: boolean;
}

const TYPE_OPTIONS = [
  { value: "STOCK", label: "Stock" },
  { value: "ACTIVACION", label: "Activación 1" },
  { value: "ACTIVACION2", label: "Activación 2" },
];

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
  const [priceSeller, setPriceSeller] = useState(initial?.priceSeller ?? "");
  const [pricePromo, setPricePromo] = useState(initial?.pricePromo ?? "");
  const [durationValue, setDurationValue] = useState(
    initial?.durationDays && Number(initial.durationDays) % 30 === 0
      ? String(Number(initial.durationDays) / 30)
      : (initial?.durationDays ?? "30")
  );
  const [durationUnit, setDurationUnit] = useState<"dias" | "meses">(
    initial?.durationDays && Number(initial.durationDays) % 30 === 0 && Number(initial.durationDays) >= 30 ? "meses" : "dias"
  );
  const [type, setType] = useState<"STOCK" | "ACTIVACION" | "ACTIVACION2">(initial?.type ?? "STOCK");
  const [activacion2Pass, setActivacion2Pass] = useState(initial?.activacion2RequestsPassword ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!imageUrl) {
      setError("Sube una imagen del producto.");
      return;
    }

    setLoading(true);
    const durationDays = durationUnit === "meses" ? Number(durationValue) * 30 : Number(durationValue);
    const input = {
      name,
      categoryId,
      imageUrl,
      description,
      conditions,
      price,
      priceSeller: priceSeller || undefined,
      pricePromo: pricePromo || undefined,
      durationDays,
      type,
      activacion2RequestsPassword: type === "ACTIVACION2" ? activacion2Pass : false,
    };

    const result = isEdit ? await updateProduct(initial!.id!, input) : await createProduct(input);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/provee/dashboard/productos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre del producto" required value={name} onChange={(e) => setName(e.target.value)} />

      <Select
        label="Categoría"
        value={categoryId}
        onChange={setCategoryId}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />

      <Select label="Tipo de producto" value={type} onChange={(v) => setType(v as typeof type)} options={TYPE_OPTIONS} />

      {type === "ACTIVACION2" && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={activacion2Pass}
            onChange={(e) => setActivacion2Pass(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Pedir también la contraseña de su cuenta (si no, solo se pide el correo)
        </label>
      )}

      <ImageUploadField
        label="Imagen del producto"
        value={imageUrl}
        onChange={setImageUrl}
        folder="productos"
        aspect="1080/1440"
        widthClass="w-36"
        buttonLabel="Seleccionar archivo — tamaño de imagen 1080 x 1440"
        hint="El tamaño debe ser 1080 x 1440 px."
      />

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

      <div className="grid grid-cols-3 gap-3">
        <Input label="Precio Normal (S/)" type="number" step="0.10" min="0.10" required value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input label="Precio Seller (S/)" type="number" step="0.10" min="0.10" value={priceSeller} onChange={(e) => setPriceSeller(e.target.value)} />
        <Input label="Precio Promoción (S/)" type="number" step="0.10" min="0.10" value={pricePromo} onChange={(e) => setPricePromo(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/90">Vigencia</label>
        <div className="flex gap-2">
          <Input type="number" min="1" required value={durationValue} onChange={(e) => setDurationValue(e.target.value)} className="flex-1" />
          <Select
            value={durationUnit}
            onChange={(v) => setDurationUnit(v as "dias" | "meses")}
            options={[{ value: "dias", label: "Días" }, { value: "meses", label: "Meses" }]}
            className="w-32"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="mt-1 flex gap-3">
        <Button type="submit" isLoading={loading} className="flex-1">
          {isEdit ? "Guardar cambios" : "Publicar producto"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/provee/dashboard/productos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
