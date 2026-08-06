"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toggleProductActive, deleteProduct } from "@/lib/actions/provider.actions";

export function ProductRowActions({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading("toggle");
    setError(null);
    const result = await toggleProductActive(productId, !isActive);
    if (!result.ok) setError(result.error);
    setLoading(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    setLoading("delete");
    setError(null);
    const result = await deleteProduct(productId);
    if (!result.ok) setError(result.error);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={handleToggle} isLoading={loading === "toggle"}>
          {isActive ? "Desactivar" : "Activar"}
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete} isLoading={loading === "delete"}>
          Eliminar
        </Button>
      </div>
      {error && <p className="max-w-[220px] text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
