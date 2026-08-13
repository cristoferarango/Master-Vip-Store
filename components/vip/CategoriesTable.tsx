"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteCategory } from "@/lib/actions/category.actions";
import { CategoryFormModal, type CategoryFormTarget } from "./CategoryFormModal";

export interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  _count: { products: number };
}

export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryFormTarget | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditTarget({ id: c.id, name: c.name, icon: c.icon });
    setModalOpen(true);
  }

  function handleDelete(c: CategoryRow) {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    setError(null);
    setBusyId(c.id);
    startTransition(async () => {
      const result = await deleteCategory(c.id);
      setBusyId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Estas plataformas son las que se ven en la cinta de arriba del catálogo y en Biblioteca.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} /> Nueva categoría
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay categorías.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-accent">
                  {c.icon || <Library size={18} />}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c._count.products} {c._count.products === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={isPending && busyId === c.id}
                  onClick={() => handleDelete(c)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal open={modalOpen} onClose={() => setModalOpen(false)} target={editTarget} />
    </div>
  );
}
