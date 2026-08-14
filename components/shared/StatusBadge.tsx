import { Badge } from "@/components/ui/Badge";

const LABELS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ACTIVA: { label: "Activa", tone: "success" },
  VENCIDA: { label: "Vencida", tone: "danger" },
  REEMBOLSADA: { label: "Reembolsada", tone: "neutral" },
  PENDIENTE: { label: "Pendiente", tone: "warning" },
  APROBADO: { label: "Aprobado", tone: "success" },
  RECHAZADO: { label: "Rechazado", tone: "danger" },
  ACTIVO: { label: "Activo", tone: "success" },
  SUSPENDIDO: { label: "Suspendido", tone: "danger" },
  DISPONIBLE: { label: "Disponible", tone: "success" },
  RESERVADA: { label: "Reservada", tone: "warning" },
  VENDIDA: { label: "Vendida", tone: "neutral" },
};

export function StatusBadge({ status }: { status: string }) {
  const info = LABELS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
