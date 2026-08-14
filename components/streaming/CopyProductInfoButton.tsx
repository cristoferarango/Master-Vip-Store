"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Solo para sellers: copia nombre + descripción + condiciones, listo para reenviar a un cliente. */
export function CopyProductInfoButton({
  productName,
  description,
  conditions,
}: {
  productName: string;
  description: string;
  conditions: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = `*${productName}*\n\n${description}\n\nCondiciones:\n${conditions}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copiado" : "Copiar info y condiciones"}
    </Button>
  );
}
