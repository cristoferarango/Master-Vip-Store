import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getMyPurchases } from "@/lib/actions/purchase.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RevealCredentials } from "@/components/streaming/RevealCredentials";
import { ReviewForm } from "@/components/streaming/ReviewForm";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";
import { formatOrderId } from "@/lib/utils/orderId";

export default async function MisComprasPage() {
  const session = await getSession();
  if (!session) return null;

  const purchases = await getMyPurchases(session.userId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 py-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Mis compras</h1>
        <p className="text-sm text-muted-foreground">Historial completo de todas tus cuentas compradas.</p>
      </div>

      {purchases.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">
          Todavía no compraste ninguna cuenta.{" "}
          <Link href="/streaming" className="font-medium text-accent hover:underline">
            Explorar catálogo
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {purchases.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-24">
                <Image src={p.product.imageUrl} alt={p.product.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{p.product.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground">Proveedor: {p.provider.businessName}</p>
                <p className="text-xs text-muted-foreground">Compra: {formatDatePE(p.purchaseDate)}</p>
                <p className="text-xs text-muted-foreground">Vence: {formatDatePE(p.expirationDate)}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatSoles(p.pricePaid.toString())}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">{formatOrderId(p.id)}</p>
              </div>
              <div className="flex gap-2">
                <RevealCredentials purchaseId={p.id} productName={p.product.name} />
                {!p.review && <ReviewForm purchaseId={p.id} productName={p.product.name} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
