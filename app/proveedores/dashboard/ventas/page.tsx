import { MessageCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getMySales } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";
import { formatOrderId } from "@/lib/utils/orderId";

export default async function ProviderSalesPage() {
  const session = await getSession();
  if (!session) return null;
  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  const sales = await getMySales(provider.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tus ventas</h1>
        <p className="text-sm text-muted-foreground">{sales.length} ventas registradas.</p>
      </div>

      {sales.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">Todavía no tienes ventas.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sales.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{s.product.name}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatOrderId(s.id)} · Comprador: {s.cliente.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Compra: {formatDatePE(s.purchaseDate)} · Vence: {formatDatePE(s.expirationDate)}
                  </p>
                  <a
                    href={`https://wa.me/${s.cliente.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-success hover:underline"
                  >
                    <MessageCircle size={13} /> {s.cliente.whatsapp}
                  </a>
                  {s.clientEmail && <p className="text-xs text-muted-foreground">Correo a activar: {s.clientEmail}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{formatSoles(s.pricePaid.toString())}</span>
                </div>
              </div>

              <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-3">
                <CredField label={s.product.type === "ACTIVACION" ? "Correo entregado" : "Usuario entregado"} value={s.credentialUsername} />
                {s.credentialPassword ? (
                  <CredField label="Contraseña entregada" value={s.credentialPassword} />
                ) : (
                  <p className="self-end text-xs text-muted-foreground">Contraseña: se la das por WhatsApp cuando la active.</p>
                )}
                {s.credentialExtra && <CredField label="PIN / notas" value={s.credentialExtra} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CredField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="select-all truncate rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-foreground">
        {value}
      </span>
    </div>
  );
}
