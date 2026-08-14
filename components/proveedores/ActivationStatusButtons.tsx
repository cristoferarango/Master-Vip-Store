"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActivationStatus } from "@/lib/actions/provider.actions";

export function ActivationStatusButtons({
  purchaseId,
  status,
}: {
  purchaseId: string;
  status: "PENDIENTE" | "ACTIVADA" | "NO_ACTIVADA" | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mark(activated: boolean) {
    setLoading(true);
    await setActivationStatus(purchaseId, activated);
    setLoading(false);
    router.refresh();
  }

  if (status === "ACTIVADA") return <span className="text-xs font-medium text-success">Cuenta activada ✓</span>;
  if (status === "NO_ACTIVADA")
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-danger">Marcada: no activada</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => mark(true)}
          className="press-feedback rounded-lg bg-success/15 px-2 py-1 text-xs font-medium text-success hover:bg-success/25"
        >
          Marcar activada
        </button>
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => mark(true)}
        className="press-feedback rounded-lg bg-success/15 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/25"
      >
        Cuenta activada
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => mark(false)}
        className="press-feedback rounded-lg bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/25"
      >
        No activada
      </button>
    </div>
  );
}
