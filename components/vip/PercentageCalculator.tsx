"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { formatSoles } from "@/lib/utils/currency";

/** Herramienta rápida: dado un monto base y un porcentaje, calcula cuánto representa. */
export function PercentageCalculator({ defaultBase = 0 }: { defaultBase?: number }) {
  const [base, setBase] = useState(String(defaultBase.toFixed(2)));
  const [percent, setPercent] = useState("10");

  const baseNum = Number(base) || 0;
  const percentNum = Number(percent) || 0;
  const result = (baseNum * percentNum) / 100;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Calculator size={15} className="text-accent" />
        Calculadora de porcentaje
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Monto base (S/)</span>
          <input
            type="number"
            step="0.01"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background-elevated px-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Porcentaje (%)</span>
          <input
            type="number"
            step="0.1"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background-elevated px-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        El {percentNum || 0}% de {formatSoles(baseNum)} es{" "}
        <span className="font-semibold text-foreground">{formatSoles(result)}</span>
      </p>
    </div>
  );
}
