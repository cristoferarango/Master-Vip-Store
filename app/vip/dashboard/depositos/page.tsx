import { getPendingDeposits } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { DepositApprovalTable } from "@/components/vip/DepositApprovalTable";

export default async function VipDepositsPage() {
  const deposits = await getPendingDeposits();

  const rows = deposits.map((d) => ({
    id: d.id,
    amount: d.amount.toString(),
    operationCode: d.operationCode,
    screenshotUrl: d.screenshotUrl,
    createdAt: d.createdAt,
    cliente: d.cliente,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Depósitos pendientes</h1>
        <p className="text-sm text-muted-foreground">
          Aprueba o rechaza los reportes de pago Yape de tus clientes.
        </p>
      </div>

      <Card>
        <DepositApprovalTable deposits={rows} />
      </Card>
    </div>
  );
}
