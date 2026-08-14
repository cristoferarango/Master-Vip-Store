import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getProviderDetail } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserDetailButton } from "@/components/vip/UserDetailModal";
import { PercentageCalculator } from "@/components/vip/PercentageCalculator";
import { formatSoles } from "@/lib/utils/currency";

export default async function VipProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await getProviderDetail(id);
  if (!provider) notFound();

  const totalEarnings = provider.purchases.reduce((sum, p) => sum + Number(p.pricePaid), 0);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayEarnings = provider.purchases
    .filter((p) => p.purchaseDate >= startOfDay)
    .reduce((sum, p) => sum + Number(p.pricePaid), 0);

  // Agrupa las compras por cliente para mostrar el gasto total de cada uno.
  const clientMap = new Map<
    string,
    { id: string; name: string; whatsapp: string; email: string; total: number; count: number }
  >();
  for (const p of provider.purchases) {
    const existing = clientMap.get(p.cliente.id);
    if (existing) {
      existing.total += Number(p.pricePaid);
      existing.count += 1;
    } else {
      clientMap.set(p.cliente.id, {
        id: p.cliente.id,
        name: p.cliente.name,
        whatsapp: p.cliente.whatsapp,
        email: p.cliente.email,
        total: Number(p.pricePaid),
        count: 1,
      });
    }
  }
  const clients = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);

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
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Generado hoy</p>
            <p className="text-xl font-bold text-foreground">{formatSoles(todayEarnings)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total generado</p>
            <p className="text-xl font-bold text-foreground">{formatSoles(totalEarnings)}</p>
          </div>
        </div>
      </Card>

      <PercentageCalculator defaultBase={totalEarnings} />

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
        <h2 className="mb-3 text-sm font-semibold text-foreground">Clientes que le compraron ({clients.length})</h2>
        <div className="flex flex-col divide-y divide-border">
          {clients.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.email} · {c.whatsapp} · {c.count} {c.count === 1 ? "compra" : "compras"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{formatSoles(c.total)}</span>
                <UserDetailButton userId={c.id} userName={c.name} />
              </div>
            </div>
          ))}
          {clients.length === 0 && <p className="py-2 text-sm text-muted-foreground">Sin ventas todavía.</p>}
        </div>
      </Card>
    </div>
  );
}
