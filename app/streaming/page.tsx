import { getActiveProducts } from "@/lib/actions/catalog.actions";
import { getSession } from "@/lib/auth/session";
import { safeQuery } from "@/lib/db/safe";
import { ProductGrid } from "@/components/streaming/ProductGrid";
import { DatabaseOfflineNotice } from "@/components/shared/DatabaseOfflineNotice";
import type { ProductCardData } from "@/components/streaming/ProductCard";

export default async function StreamingHomePage() {
  const [{ data: products, dbError }, session] = await Promise.all([
    safeQuery(() => getActiveProducts(), []),
    getSession(),
  ]);

  const items: ProductCardData[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.imageUrl,
    price: p.price.toString(),
    stockAvailable: p._count.stockItems,
    provider: {
      businessName: p.provider.businessName,
      ratingAvg: p.provider.ratingAvg.toString(),
      ratingCount: p.provider.ratingCount,
    },
  }));

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Cuentas premium al mejor precio, <span className="text-gradient">al instante</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Netflix, HBO Max, Canva, ChatGPT, Gemini, Claude, IPTV y más — con proveedores
          verificados y soporte por WhatsApp.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Catálogo</h2>
          <span className="text-sm text-muted-foreground">{items.length} productos</span>
        </div>
        {dbError ? <DatabaseOfflineNotice /> : <ProductGrid products={items} isLoggedIn={!!session} />}
      </section>
    </div>
  );
}
