"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { createCategory, updateCategory } from "@/lib/actions/category.actions";

export interface CategoryFormTarget {
  id: string;
  name: string;
  iconUrl: string | null;
}

export function CategoryFormModal({
  open,
  onClose,
  target,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, edita esa categoría; si no, crea una nueva. */
  target: CategoryFormTarget | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(target?.name ?? "");
  const [iconUrl, setIconUrl] = useState(target?.iconUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    onClose();
    setTimeout(() => {
      setName(target?.name ?? "");
      setIconUrl(target?.iconUrl ?? "");
      setError(null);
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = target
      ? await updateCategory(target.id, { name, iconUrl })
      : await createCategory({ name, iconUrl });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={target ? "Editar categoría" : "Nueva categoría"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          placeholder="Ej. Netflix"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <ImageUploadField
          label="Ícono"
          value={iconUrl}
          onChange={setIconUrl}
          folder="iconos"
          aspect="1/1"
          widthClass="w-20"
          buttonLabel="Subir ícono — 1000 x 1000"
          hint="SVG o PNG, 1000 x 1000 px."
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" isLoading={loading}>
          {target ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </form>
    </Modal>
  );
}
