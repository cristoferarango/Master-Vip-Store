import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getMyPendingPurchaseRequests } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { MyPurchaseRequestsTable } from "@/components/proveedores/MyPurchaseRequestsTable";

export default async function ProviderPurchaseRequestsPage() {
  const session = await getSession();
  if (!session) return null;
  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  const requests = await getMyPendingPurchaseRequests(provider.id);

  const rows = requests.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    operationCode: r.operationCode,
    screenshotUrl: r.screenshotUrl,
    createdAt: r.createdAt,
    cliente: r.cliente,
    product: r.product,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Solicitudes de compra</h1>
        <p className="text-sm text-muted-foreground">
          Revisa tu Yape, confirma que el pago llegó, y aprueba o rechaza cada solicitud.
        </p>
      </div>

      <Card>
        <MyPurchaseRequestsTable requests={rows} />
      </Card>
    </div>
  );
}
