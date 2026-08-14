import { getPendingPurchaseRequests } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { PurchaseRequestApprovalTable } from "@/components/vip/PurchaseRequestApprovalTable";

export default async function VipPurchaseRequestsPage() {
  const requests = await getPendingPurchaseRequests();

  const rows = requests.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    operationCode: r.operationCode,
    screenshotUrl: r.screenshotUrl,
    createdAt: r.createdAt,
    cliente: r.cliente,
    product: r.product,
    provider: r.provider,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Solicitudes de compra</h1>
        <p className="text-sm text-muted-foreground">
          Cada cliente paga directo al Yape del proveedor — revisa la captura antes de aprobar.
        </p>
      </div>

      <Card>
        <PurchaseRequestApprovalTable requests={rows} />
      </Card>
    </div>
  );
}
