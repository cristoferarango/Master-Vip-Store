import Link from "next/link";
import { getAllPurchases } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export default async function VipSalesPage() {
  const purchases = await getAllPurchases();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Todas las ventas</h1>
        <p className="text-sm text-muted-foreground">{purchases.length} compras registradas en la plataforma.</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
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
