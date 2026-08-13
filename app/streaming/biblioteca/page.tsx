import { Library } from "lucide-react";
import { getCategoriesWithProductCount } from "@/lib/actions/catalog.actions";
import { Card } from "@/components/ui/Card";

/**
 * Biblioteca = vitrina de todas las plataformas que maneja Master Vip Store
 * (no es el historial de compras del cliente — eso vive en "Mis compras").
 */
export default async function BibliotecaPage() {
  const categories = await getCategoriesWithProductCount();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 py-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">
          Todas las plataformas y servicios que manejamos en Master Vip Store.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Card key={c.id} className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="animate-float flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl text-accent">
              {c.icon || <Library size={22} />}
            </span>
            <h3 className="font-semibold text-foreground">{c.name}</h3>
            <p className="text-xs text-muted-foreground">
              {c._count.products} {c._count.products === 1 ? "cuenta disponible" : "cuentas disponibles"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
