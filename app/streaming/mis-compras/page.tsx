import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getMyPurchases, getMyPurchaseRequests } from "@/lib/actions/purchase.actions";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RevealCredentials } from "@/components/streaming/RevealCredentials";
import { ReviewForm } from "@/components/streaming/ReviewForm";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";
import { formatOrderId } from "@/lib/utils/orderId";
import { buildActivationWhatsappLink } from "@/lib/utils/whatsapp";

export default async function MisComprasPage() {
  const session = await getSession();
  if (!session) return null;

  const [purchases, requests] = await Promise.all([
    getMyPurchases(session.userId),
    getMyPurchaseRequests(session.userId),
  ]);

  // Une compras ya aprobadas y solicitudes pendientes/rechazadas en una sola
  // línea de tiempo, más reciente primero.
  type Item =
    | { kind: "purchase"; date: Date; data: (typeof purchases)[number] }
    | { kind: "request"; date: Date; data: (typeof requests)[number] };

  const items: Item[] = [
    ...purchases.map((p) => ({ kind: "purchase" as const, date: p.purchaseDate, data: p })),
    ...requests.map((r) => ({ kind: "request" as const, date: r.createdAt, data: r })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 py-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Mis compras</h1>
        <p className="text-sm text-muted-foreground">Historial completo de todas tus cuentas compradas.</p>
      </div>

      {items.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">
          Todavía no compraste ninguna cuenta.{" "}
          <Link href="/streaming" className="font-medium text-accent hover:underline">
            Explorar catálogo
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) =>
            item.kind === "purchase" ? (
              <Card key={`p-${item.data.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-24">
                  <Image src={item.data.product.imageUrl} alt={item.data.product.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{item.data.product.name}</h3>
                    <StatusBadge status={item.data.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Proveedor: {item.data.provider.businessName}</p>
                  <p className="text-xs text-muted-foreground">Compra: {formatDatePE(item.data.purchaseDate)}</p>
                  <p className="text-xs text-muted-foreground">Vence: {formatDatePE(item.data.expirationDate)}</p>
                  {item.data.clientEmail && (
                    <p className="text-xs text-muted-foreground">Correo activado: {item.data.clientEmail}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatSoles(item.data.pricePaid.toString())}</p>
                  <p className="mt-1 inline-block rounded-md border border-border-strong bg-surface px-2 py-0.5 font-mono text-sm font-bold tracking-wide text-foreground">
                    {formatOrderId(item.data.id)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RevealCredentials
                    purchaseId={item.data.id}
                    productName={item.data.product.name}
                    whatsappLink={
                      item.data.product.type === "ACTIVACION" && item.data.provider.user.whatsapp
                        ? buildActivationWhatsappLink({
                            whatsapp: item.data.provider.user.whatsapp,
                            productName: item.data.product.name,
                            orderCode: formatOrderId(item.data.id),
                          })
                        : null
                    }
                  />
                  {!item.data.review && <ReviewForm purchaseId={item.data.id} productName={item.data.product.name} />}
                </div>
              </Card>
            ) : (
              <Card key={`r-${item.data.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-24">
                  <Image src={item.data.product.imageUrl} alt={item.data.product.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{item.data.product.name}</h3>
                    <StatusBadge status={item.data.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Proveedor: {item.data.provider.businessName}</p>
                  <p className="text-xs text-muted-foreground">Enviado: {formatDatePE(item.data.createdAt)}</p>
                  {item.data.status === "RECHAZADO" && (
                    <p className="text-xs text-danger">
                      {item.data.rejectionReason ? `Motivo: ${item.data.rejectionReason}` : "No se pudo validar el pago."}
                    </p>
                  )}
                  {item.data.status === "PENDIENTE" && (
                    <p className="text-xs text-warning">Esperando que se valide tu comprobante.</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatSoles(item.data.amount.toString())}</p>
                  <p className="mt-1 inline-block rounded-md border border-border-strong bg-surface px-2 py-0.5 font-mono text-sm font-bold tracking-wide text-foreground">
                    {formatOrderId(item.data.id)}
                  </p>
                </div>
                {item.data.status === "PENDIENTE" &&
                  item.data.product.type === "ACTIVACION" &&
                  item.data.provider.user.whatsapp && (
                    <a
                      href={buildActivationWhatsappLink({
                        whatsapp: item.data.provider.user.whatsapp,
                        productName: item.data.product.name,
                        orderCode: formatOrderId(item.data.id),
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press-feedback inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-primary to-primary-strong px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
