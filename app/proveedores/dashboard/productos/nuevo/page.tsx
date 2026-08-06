import { getCategories } from "@/lib/actions/catalog.actions";
import { Card } from "@/components/ui/Card";
import { ProductForm } from "@/components/proveedores/ProductForm";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-foreground">Nuevo producto</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Completa los datos. Después de crearlo, agrega el stock de credenciales disponibles.
      </p>
      <Card>
        <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </Card>
    </div>
  );
}
