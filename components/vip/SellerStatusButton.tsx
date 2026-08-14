"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toggleSellerStatus } from "@/lib/actions/admin.actions";
import type { ProviderStatus } from "@prisma/client";

export function SellerStatusButton({
  userId,
  isSeller,
  sellerStatus,
}: {
  userId: string;
  isSeller: boolean;
  sellerStatus: ProviderStatus | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isSeller) return <span className="text-xs text-muted-foreground">—</span>;

  function setStatus(status: ProviderStatus) {
    startTransition(async () => {
      await toggleSellerStatus(userId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Badge tone={sellerStatus === "ACTIVO" ? "primary" : "neutral"}>
        {sellerStatus === "ACTIVO" ? "Seller activo" : sellerStatus === "SUSPENDIDO" ? "Seller suspendido" : "Seller pendiente"}
      </Badge>
      {sellerStatus !== "ACTIVO" && (
        <Button size="sm" variant="secondary" isLoading={isPending} onClick={() => setStatus("ACTIVO")}>
          Activar
        </Button>
      )}
      {sellerStatus === "ACTIVO" && (
        <Button size="sm" variant="danger" isLoading={isPending} onClick={() => setStatus("SUSPENDIDO")}>
          Suspender
        </Button>
      )}
    </div>
  );
}
