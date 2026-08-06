import Link from "next/link";
import { getPlatformStats, getPendingDeposits } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExpirationCheckButton } from "@/components/vip/ExpirationCheckButton";
import { formatSoles } from "@/lib/utils/currency";

export default async function VipDashboardPage() {
  const [stats, pendingDeposits] = await Promise.all([getPlatformStats(), getPendingDeposits()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Resumen general</h1>
          <p className="text-sm text-muted-foreground">Estado global de Master Vip Store.</p>
        </div>
        <ExpirationCheckButton />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ingresos totales" value={formatSoles(stats.totalRevenue)} />
        <StatCard label="Ingresos este mes" value={formatSoles(stats.revenueThisMonth)} />
        <StatCard label="Clientes registrados" value={String(stats.totalUsers)} sub={`+${stats.newUsersThisWeek} esta semana`} />
        <StatCard label="Ventas totales" value={String(stats.totalPurchases)} sub={`${stats.purchasesThisMonth} este mes`} />
        <StatCard label="Proveedores activos" value={`${stats.activeProviders} / ${stats.totalProviders}`} />
        <StatCard
          label="Depósitos pendientes"
          value={String(stats.pendingDeposits)}
          tone={stats.pendingDeposits > 0 ? "warning" : undefined}
        />
      </div>

      {pendingDeposits.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Depósitos esperando aprobación</h2>
            <Link href="/vip/dashboard/depositos" className="text-xs font-medium text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {pendingDeposits.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{d.cliente.name}</p>
                  <p className="text-xs text-muted-foreground">{d.cliente.whatsapp}</p>
                </div>
                <span className="font-semibold text-foreground">{formatSoles(d.amount.toString())}</span>
              </div>
            ))}
          </div>
          <Link href="/vip/dashboard/depositos" className="mt-3 block">
            <Button size="sm" className="w-full">
              Revisar depósitos
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "warning";
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "warning" ? "text-warning" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
