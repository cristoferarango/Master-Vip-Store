import Link from "next/link";
import { getAllPurchases } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PercentageCalculator } from "@/components/vip/PercentageCalculator";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";
import { formatOrderId } from "@/lib/utils/orderId";

export default async function VipSalesPage() {
  const purchases = await getAllPurchases();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalRevenue = 0;
  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;
  const byProvider = new Map<string, { name: string; total: number; count: number }>();
  const byProduct = new Map<string, { name: string; total: number; count: number }>();

  for (const p of purchases) {
    const amount = Number(p.pricePaid);
    totalRevenue += amount;
    if (p.purchaseDate >= startOfDay) todayRevenue += amount;
    if (p.purchaseDate >= startOfWeek) weekRevenue += amount;
    if (p.purchaseDate >= startOfMonth) monthRevenue += amount;

    const provEntry = byProvider.get(p.provider.businessName) ?? { name: p.provider.businessName, total: 0, count: 0 };
    provEntry.total += amount;
    provEntry.count += 1;
    byProvider.set(p.provider.businessName, provEntry);

    const prodEntry = byProduct.get(p.product.name) ?? { name: p.product.name, total: 0, count: 0 };
    prodEntry.total += amount;
    prodEntry.count += 1;
    byProduct.set(p.product.name, prodEntry);
  }

  const topProviders = Array.from(byProvider.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  const topProducts = Array.from(byProduct.values()).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Ventas</h1>
        <p className="text-sm text-muted-foreground">Análisis de ventas de toda la plataforma.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Hoy" value={formatSoles(todayRevenue)} />
        <StatCard label="Últimos 7 días" value={formatSoles(weekRevenue)} />
        <StatCard label="Este mes" value={formatSoles(monthRevenue)} />
        <StatCard label="Total histórico" value={formatSoles(totalRevenue)} />
      </div>

      <PercentageCalculator defaultBase={totalRevenue} />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Ranking de proveedores</h2>
          <div className="flex flex-col divide-y divide-border">
            {topProviders.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">
                  <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                  {p.name}
                </span>
                <span className="font-medium text-foreground">
                  {formatSoles(p.total)} <span className="text-xs text-muted-foreground">({p.count})</span>
                </span>
              </div>
            ))}
            {topProviders.length === 0 && <p className="py-2 text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Ranking de productos</h2>
          <div className="flex flex-col divide-y divide-border">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">
                  <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                  {p.name}
                </span>
                <span className="font-medium text-foreground">
                  {formatSoles(p.total)} <span className="text-xs text-muted-foreground">({p.count})</span>
                </span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="py-2 text-sm text-muted-foreground">Sin datos todavía.</p>}
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatOrderId(p.id)}</td>
                <td className="px-4 py-3 text-foreground">{p.product.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.cliente.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.provider.businessName}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDatePE(p.purchaseDate)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDatePE(p.expirationDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{formatSoles(p.pricePaid.toString())}</td>
                <td className="px-4 py-3">
                  <Link href={`/vip/dashboard/credenciales/${p.id}`} className="text-xs font-medium text-accent hover:underline">
                    Ver credenciales
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay ventas.</p>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </Card>
  );
}
