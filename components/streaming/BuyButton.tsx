"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { purchaseProduct } from "@/lib/actions/purchase.actions";

export function BuyButton({
  productId,
  isLoggedIn,
  outOfStock,
  size = "lg",
}: {
  productId: string;
  isLoggedIn: boolean;
  outOfStock: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsFunds, setNeedsFunds] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/streaming/login");
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsFunds(false);

    const result = await purchaseProduct(productId);

    if (!result.ok) {
      setError(result.error);
      if (result.code === "INSUFFICIENT_BALANCE") setNeedsFunds(true);
      if (result.code === "OUT_OF_STOCK") router.refresh();
      setLoading(false);
      return;
    }

    router.push("/streaming/mis-compras");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size={size} className="w-full" onClick={handleClick} isLoading={loading} disabled={outOfStock}>
        {outOfStock ? "Agotado" : "Comprar ahora"}
      </Button>
      {error && (
        <p className="text-center text-[11px] leading-snug text-danger">
          {error}
          {needsFunds && (
            <>
              {" "}
              <Link href="/streaming/wallet/recargar" className="font-medium text-accent hover:underline">
                Recargar saldo
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
