import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getProductStock } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { StockCredentialForm } from "@/components/proveedores/StockCredentialForm";
import { StockRow } from "@/components/proveedores/StockRow";

export default async function ProductStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  const result = await getProductStock(id, provider.id);
  if (!result) notFound();
  const { product, stock } = result;

  const disponibles = stock.filter((s) => s.status === "DISPONIBLE").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Stock — {product.name}</h1>
        <p className="text-sm text-muted-foreground">{disponibles} cuentas disponibles de {stock.length} totales.</p>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Agregar cuenta al stock</h2>
        <StockCredentialForm productId={product.id} productType={product.type} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Cuentas cargadas</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no agregaste ninguna cuenta.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {stock.map((s) => (
              <StockRow key={s.id} stock={s} productType={product.type} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
