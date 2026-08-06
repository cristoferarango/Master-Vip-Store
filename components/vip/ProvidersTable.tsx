"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toggleProviderStatus } from "@/lib/actions/admin.actions";
import { formatSoles } from "@/lib/utils/currency";

export interface ProviderRow {
  id: string;
  businessName: string;
  status: "PENDIENTE" | "ACTIVO" | "SUSPENDIDO";
  ratingAvg: string;
  productsCount: number;
  salesCount: number;
  earnings: number;
  email: string;
  whatsapp: string;
}

export function ProvidersTable({ providers }: { providers: ProviderRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, newStatus: "ACTIVO" | "SUSPENDIDO") {
    setPendingId(id);
    startTransition(async () => {
      await toggleProviderStatus(id, newStatus);
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Proveedor</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Productos</th>
            <th className="px-4 py-3 font-medium">Ventas</th>
            <th className="px-4 py-3 font-medium">Ganancias</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {providers.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <Link href={`/vip/dashboard/proveedores/${p.id}`} className="font-medium text-foreground hover:text-accent">
                  {p.businessName}
                </Link>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.productsCount}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.salesCount}</td>
              <td className="px-4 py-3 font-medium text-foreground">{formatSoles(p.earnings)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  {p.status !== "ACTIVO" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={isPending && pendingId === p.id}
                      onClick={() => handleToggle(p.id, "ACTIVO")}
                    >
                      Activar
                    </Button>
                  )}
                  {p.status !== "SUSPENDIDO" && (
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={isPending && pendingId === p.id}
                      onClick={() => handleToggle(p.id, "SUSPENDIDO")}
                    >
                      Suspender
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
