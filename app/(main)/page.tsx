import { getActiveProducts } from "@/lib/actions/catalog.actions";
import { getSiteContent } from "@/lib/actions/admin.actions";
import { DEFAULT_SITE_CONTENT } from "@/lib/validators/siteContent.schema";
import { safeQuery } from "@/lib/db/safe";
import { ProductGrid } from "@/components/streaming/ProductGrid";
import { DatabaseOfflineNotice } from "@/components/shared/DatabaseOfflineNotice";
import type { ProductCardData } from "@/components/streaming/ProductCard";

export default async function StreamingHomePage() {
  const [{ data: products, dbError }, { data: content }] = await Promise.all([
    safeQuery(() => getActiveProducts(), []),
    safeQuery(() => getSiteContent(), DEFAULT_SITE_CONTENT),
  ]);

  const items: ProductCardData[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.imageUrl,
    price: p.price.toString(),
    stockAvailable: p._count.stockItems,
    isOpenNow: p.isOpenNow,
    provider: {
      businessName: p.provider.businessName,
      ratingAvg: p.provider.ratingAvg.toString(),
      ratingCount: p.provider.ratingCount,
    },
  }));

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center">
        <h1 className="animate-build text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {content.streamingTitle}
        </h1>
        <p className="animate-build build-delay-1 mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {content.streamingDescription}
        </p>
      </section>

      <section className="animate-build build-delay-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Catálogo</h2>
          <span className="text-sm text-muted-foreground">{items.length} productos</span>
        </div>
        {dbError ? <DatabaseOfflineNotice /> : <ProductGrid products={items} />}
      </section>
    </div>
  );
}
