import { getAllProviders } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { ProvidersTable } from "@/components/vip/ProvidersTable";

export default async function VipProvidersPage() {
  const providers = await getAllProviders();

  const rows = providers.map((p) => ({
    id: p.id,
    businessName: p.businessName,
    status: p.status,
    ratingAvg: p.ratingAvg.toString(),
    productsCount: p._count.products,
    salesCount: p._count.purchases,
    earnings: p.purchases.reduce((sum, x) => sum + Number(x.pricePaid), 0),
    email: p.user.email,
    whatsapp: p.user.whatsapp,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Proveedores</h1>
        <p className="text-sm text-muted-foreground">
          Activa, suspende y revisa las ganancias de cada proveedor.
        </p>
      </div>

      <Card className="p-0">
        <ProvidersTable providers={rows} />
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay proveedores.</p>
        )}
      </Card>
    </div>
  );
}
