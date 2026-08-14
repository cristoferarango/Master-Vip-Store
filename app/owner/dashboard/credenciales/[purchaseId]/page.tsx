import { notFound } from "next/navigation";
import Image from "next/image";
import { getPurchaseDetailForAdmin } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RevealAdminCredentials } from "@/components/vip/RevealAdminCredentials";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export default async function VipCredentialsPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const purchase = await getPurchaseDetailForAdmin(purchaseId);
  if (!purchase) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Credenciales de la compra</h1>
        <p className="text-sm text-muted-foreground">Solo tú puedes ver esto — la acción queda registrada.</p>
      </div>

      <Card className="flex gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
          <Image src={purchase.product.imageUrl} alt={purchase.product.name} fill className="object-cover" unoptimized />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">{purchase.product.name}</h2>
            <StatusBadge status={purchase.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Cliente: {purchase.cliente.name} ({purchase.cliente.whatsapp})
          </p>
          <p className="text-xs text-muted-foreground">Proveedor: {purchase.provider.businessName}</p>
          <p className="text-xs text-muted-foreground">
            Compra: {formatDatePE(purchase.purchaseDate)} · Vence: {formatDatePE(purchase.expirationDate)} ·{" "}
            {formatSoles(purchase.pricePaid.toString())}
          </p>
        </div>
      </Card>

      <Card>
        <RevealAdminCredentials purchaseId={purchase.id} />
      </Card>
    </div>
  );
}
