import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getProductStock } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StockCredentialForm } from "@/components/proveedores/StockCredentialForm";
import { RevealStockCredentials } from "@/components/proveedores/RevealStockCredentials";
import { formatDatePE } from "@/lib/utils/dates";

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
        <StockCredentialForm productId={product.id} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Cuentas cargadas</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no agregaste ninguna cuenta.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {stock.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-muted-foreground">Agregada {formatDatePE(s.createdAt)}</span>
                </div>
                {s.status === "DISPONIBLE" && <RevealStockCredentials stockId={s.id} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
