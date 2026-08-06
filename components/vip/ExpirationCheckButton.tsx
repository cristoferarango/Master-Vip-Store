"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { checkExpiringPurchases } from "@/lib/actions/admin.actions";

export function ExpirationCheckButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    const res = await checkExpiringPurchases();
    setLoading(false);
    if (res.ok) {
      setResult(`Se notificó a ${res.data.notified} cliente(s) con cuentas por vencer.`);
      router.refresh();
    } else {
      setResult(res.error);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button size="sm" variant="secondary" onClick={handleClick} isLoading={loading} className="w-fit gap-1.5">
        <BellRing size={14} /> Revisar vencimientos
      </Button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
