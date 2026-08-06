import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getDashboardStats, getMyProducts } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatSoles } from "@/lib/utils/currency";

export default async function ProviderDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  const [stats, products] = await Promise.all([
    getDashboardStats(provider.id),
    getMyProducts(provider.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Resumen</h1>
          <p className="text-sm text-muted-foreground">Hola, {provider.businessName} 👋</p>
        </div>
        <Link href="/proveedores/dashboard/productos/nuevo">
          <Button>+ Nuevo producto</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ganancias totales" value={formatSoles(stats.totalEarnings)} />
        <StatCard label="Ganancias este mes" value={formatSoles(stats.earningsThisMonth)} />
        <StatCard label="Ventas totales" value={String(stats.totalSales)} />
        <StatCard label="Productos activos" value={String(stats.activeProducts)} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Tus productos recientes</h2>
          <Link href="/proveedores/dashboard/productos" className="text-xs font-medium text-accent hover:underline">
            Ver todos
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no publicaste ningún producto.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{p._count.stockItems} disponibles</span>
              </div>
            ))}
          </div>
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
