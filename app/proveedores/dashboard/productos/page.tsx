import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getMyProducts } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductRowActions } from "@/components/proveedores/ProductRowActions";
import { formatSoles } from "@/lib/utils/currency";

export default async function ProviderProductsPage() {
  const session = await getSession();
  if (!session) return null;
  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  const products = await getMyProducts(provider.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tus productos</h1>
        <Link href="/proveedores/dashboard/productos/nuevo">
          <Button>+ Nuevo producto</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">
          Todavía no publicaste ningún producto.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Activo" : "Inactivo"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.category.name} · {formatSoles(p.price.toString())} · {p._count.stockItems} disponibles
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link href={`/proveedores/dashboard/productos/${p.id}/stock`}>
                    <Button size="sm" variant="secondary">
                      Stock
                    </Button>
                  </Link>
                  <Link href={`/proveedores/dashboard/productos/${p.id}/editar`}>
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </Link>
                </div>
                <ProductRowActions productId={p.id} isActive={p.isActive} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
