import { MessageCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getMySales } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

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
            <Card key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{s.product.name}</h3>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cliente: {s.cliente.name} · Compra: {formatDatePE(s.purchaseDate)} · Vence:{" "}
                  {formatDatePE(s.expirationDate)}
                </p>
                <a
                  href={`https://wa.me/${s.cliente.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-success hover:underline"
                >
                  <MessageCircle size={13} /> {s.cliente.whatsapp}
                </a>
              </div>
              <span className="font-semibold text-foreground">{formatSoles(s.pricePaid.toString())}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
