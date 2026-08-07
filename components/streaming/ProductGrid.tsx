import { ProductCard, type ProductCardData } from "./ProductCard";

export function ProductGrid({ products, isLoggedIn }: { products: ProductCardData[]; isLoggedIn: boolean }) {
  if (products.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
        Todavía no hay productos publicados. Vuelve pronto.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product, i) => {
        const d = Math.min(i * 0.045, 0.4);
        return (
          <div key={product.slug} className="animate-build-float" style={{ animationDelay: `${d}s, ${d + 0.5}s` }}>
            <ProductCard product={product} isLoggedIn={isLoggedIn} />
          </div>
        );
      })}
    </div>
  );
}
