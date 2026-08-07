import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { BuyButton } from "./BuyButton";
import { formatSoles } from "@/lib/utils/currency";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number | string;
  provider: { businessName: string; ratingAvg: number | string; ratingCount: number };
  stockAvailable: number;
}

export function ProductCard({ product, isLoggedIn }: { product: ProductCardData; isLoggedIn: boolean }) {
  const rating = Number(product.provider.ratingAvg);
  const outOfStock = product.stockAvailable <= 0;

  return (
    <div className="neon-trace glass-card group flex flex-col overflow-hidden rounded-2xl transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-move)] hover:-translate-y-1.5 hover:border-border-strong hover:shadow-xl hover:shadow-primary/10">
      <Link href={`/streaming/productos/${product.slug}`} className="relative block aspect-[3/4] w-full overflow-hidden bg-surface-strong">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 20vw"
        />
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-danger/90 px-2 py-0.5 text-xs font-medium text-white">
            Agotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <Link href={`/streaming/productos/${product.slug}`}>
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground hover:text-accent">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="line-clamp-1">{product.provider.businessName}</span>
          <span className="flex shrink-0 items-center gap-1 text-warning">
            <Star size={12} fill="currentColor" className="animate-wiggle" />
            {rating > 0 ? rating.toFixed(1) : "Nuevo"}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">{formatSoles(product.price)}</span>
        </div>

        <div className="mt-1">
          <BuyButton productId={product.id} isLoggedIn={isLoggedIn} outOfStock={outOfStock} size="sm" />
        </div>
      </div>
    </div>
  );
}
