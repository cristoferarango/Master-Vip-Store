import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getMyActivePurchases } from "@/lib/actions/purchase.actions";
import { Card } from "@/components/ui/Card";
import { RevealCredentials } from "@/components/streaming/RevealCredentials";
import { formatDatePE, daysUntil } from "@/lib/utils/dates";

export default async function BibliotecaPage() {
  const session = await getSession();
  if (!session) return null;

  const purchases = await getMyActivePurchases(session.userId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 py-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">Tus cuentas activas, listas para usar.</p>
      </div>

      {purchases.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">
          No tienes cuentas activas todavía.{" "}
          <Link href="/streaming" className="font-medium text-accent hover:underline">
            Explorar catálogo
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {purchases.map((p) => {
            const remaining = daysUntil(p.expirationDate);
            return (
              <Card key={p.id} className="flex flex-col gap-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                  <Image src={p.product.imageUrl} alt={p.product.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.product.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.provider.businessName}</p>
                  <p className={`mt-1 text-xs ${remaining <= 3 ? "text-warning" : "text-muted-foreground"}`}>
                    {remaining > 0 ? `Vence en ${remaining} días (${formatDatePE(p.expirationDate)})` : "Vence hoy"}
                  </p>
                </div>
                <RevealCredentials purchaseId={p.id} productName={p.product.name} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
