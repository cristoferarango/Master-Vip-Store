"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PaymentCheckoutModal } from "./PaymentCheckoutModal";

export function BuyButton({
  productId,
  isLoggedIn,
  outOfStock,
  closed = false,
  size = "lg",
}: {
  productId: string;
  isLoggedIn: boolean;
  outOfStock: boolean;
  /** El proveedor (o la plataforma) está fuera de su horario de atención ahora mismo. */
  closed?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const disabled = outOfStock || closed;

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/streaming/login");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button size={size} className="w-full" onClick={handleClick} disabled={disabled}>
        {outOfStock ? "Agotado" : closed ? "Fuera de horario" : "Comprar ahora"}
      </Button>
      <PaymentCheckoutModal productId={productId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
