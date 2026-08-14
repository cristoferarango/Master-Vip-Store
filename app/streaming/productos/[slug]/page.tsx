import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getProductBySlug } from "@/lib/actions/catalog.actions";
import { getSession } from "@/lib/auth/session";
import { getProductReviews } from "@/lib/actions/review.actions";
import { safeQuery } from "@/lib/db/safe";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BuyButton } from "@/components/streaming/BuyButton";
import { DatabaseOfflineNotice } from "@/components/shared/DatabaseOfflineNotice";
import { formatSoles } from "@/lib/utils/currency";
import { formatDatePE } from "@/lib/utils/dates";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ data: product, dbError }, session] = await Promise.all([
    safeQuery(() => getProductBySlug(slug), null),
    getSession(),
  ]);

  if (dbError) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <DatabaseOfflineNotice />
      </div>
    );
  }

  if (!product || !product.isActive) notFound();

  const [{ data: reviews }, rating] = await Promise.all([
    safeQuery(() => getProductReviews(product.id), []),
    Promise.resolve(Number(product.provider.ratingAvg)),
  ]);
  const outOfStock = product._count.stockItems <= 0;
  const closed = !outOfStock && !product.isOpenNow;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Proporción fija 1080x1440 (3:4) — el ancho se limita para que la
            imagen completa entre en pantalla sin scroll, sin recortar el
            aspecto original. */}
        <div className="relative aspect-[1080/1440] w-full max-w-[320px] mx-auto overflow-hidden rounded-2xl border border-border md:mx-0">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <Badge tone="primary">{product.category.name}</Badge>
            <h1 className="mt-3 text-2xl font-bold text-foreground">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Avatar name={product.provider.businessName} src={product.provider.avatarUrl} size={36} />
            <div>
              <p className="text-sm font-medium text-foreground">{product.provider.businessName}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star size={12} className="text-warning" fill="currentColor" />
                {rating > 0 ? `${rating.toFixed(1)} (${product.provider.ratingCount} reseñas)` : "Proveedor nuevo"}
              </p>
            </div>
          </div>

          <p className="text-3xl font-bold text-foreground">{formatSoles(product.price.toString())}</p>

          <BuyButton productId={product.id} isLoggedIn={!!session} outOfStock={outOfStock} closed={closed} />
          {closed && (
            <p className="text-xs text-warning">
              Este proveedor no está atendiendo en este horario. Vuelve a intentarlo más tarde.
            </p>
          )}

          <Card>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Descripción</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
          </Card>

          <Card>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Condiciones</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{product.conditions}</p>
          </Card>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Reseñas de la comunidad</h2>
        {reviews.length === 0 ? (
          <Card className="text-sm text-muted-foreground">
            Este producto todavía no tiene reseñas. ¡Sé el primero en comprarlo y opinar!
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{r.cliente.name}</p>
                  <span className="text-xs text-muted-foreground">{formatDatePE(r.createdAt)}</span>
                </div>
                <div className="mb-1.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      className={n <= r.rating ? "text-warning" : "text-border-strong"}
                      fill={n <= r.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
