import Link from "next/link";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getWallet, getWalletTransactions } from "@/lib/actions/wallet.actions";
import { getMyDepositRequests } from "@/lib/actions/deposit.actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export default async function WalletPage() {
  const session = await getSession();
  if (!session) return null; // el proxy ya protege esta ruta

  const [wallet, transactions, deposits] = await Promise.all([
    getWallet(session.userId),
    getWalletTransactions(session.userId),
    getMyDepositRequests(session.userId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-4">
      <Card className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-accent">
            <WalletIcon size={22} />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Tu saldo disponible</p>
            <p className="text-3xl font-bold text-foreground">{formatSoles(wallet.balance.toString())}</p>
          </div>
        </div>
        <Link href="/streaming/wallet/recargar">
          <Button>Recargar saldo</Button>
        </Link>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Solicitudes de recarga</h2>
        {deposits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no has reportado ningún depósito.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{formatSoles(d.amount.toString())}</p>
                  <p className="text-xs text-muted-foreground">{formatDatePE(d.createdAt)}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Movimientos</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes movimientos.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {transactions.map((t) => {
              const positive = Number(t.amount) >= 0;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    {positive ? (
                      <ArrowDownCircle size={16} className="text-success" />
                    ) : (
                      <ArrowUpCircle size={16} className="text-danger" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {t.type === "RECARGA" ? "Recarga Yape" : t.type === "COMPRA" ? "Compra de cuenta" : "Ajuste"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDatePE(t.createdAt)}</p>
                    </div>
                  </div>
                  <span className={positive ? "font-semibold text-success" : "font-semibold text-danger"}>
                    {positive ? "+" : ""}
                    {formatSoles(t.amount.toString())}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
