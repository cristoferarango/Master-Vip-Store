import { searchProducts } from "@/lib/actions/catalog.actions";
import { safeQuery } from "@/lib/db/safe";
import { ProductGrid } from "@/components/streaming/ProductGrid";
import { DatabaseOfflineNotice } from "@/components/shared/DatabaseOfflineNotice";
import type { ProductCardData } from "@/components/streaming/ProductCard";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { data: products, dbError } = await safeQuery(() => searchProducts(q), []);

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {q ? <>Resultados para “{q}”</> : "Búsqueda"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length} producto{items.length === 1 ? "" : "s"} encontrado{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {dbError ? (
        <DatabaseOfflineNotice />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? "No encontramos nada con ese nombre. Prueba con otra palabra." : "Escribe algo en la barra de búsqueda."}
        </p>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
