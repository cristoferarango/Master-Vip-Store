import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getProviderDetail } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export default async function VipProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await getProviderDetail(id);
  if (!provider) notFound();

  const earnings = provider.purchases.reduce((sum, p) => sum + Number(p.pricePaid), 0);

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={provider.businessName} src={provider.avatarUrl} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{provider.businessName}</h1>
              <StatusBadge status={provider.status} />
            </div>
            <p className="text-xs text-muted-foreground">{provider.user.email}</p>
            <a
              href={`https://wa.me/${provider.user.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-success hover:underline"
            >
              <MessageCircle size={13} /> {provider.user.whatsapp}
            </a>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Ganancias totales</p>
          <p className="text-2xl font-bold text-foreground">{formatSoles(earnings)}</p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Productos ({provider.products.length})</h2>
        <div className="flex flex-col divide-y divide-border">
          {provider.products.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                {p._count.stockItems} disponibles · {formatSoles(p.price.toString())}
              </span>
            </div>
          ))}
          {provider.products.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Sin productos publicados.</p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Clientes que le compraron</h2>
        <div className="flex flex-col divide-y divide-border">
          {provider.purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-foreground">{p.cliente.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.product.name} · {formatDatePE(p.purchaseDate)}
                </p>
              </div>
              <span className="font-medium text-foreground">{formatSoles(p.pricePaid.toString())}</span>
            </div>
          ))}
          {provider.purchases.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Sin ventas todavía.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
