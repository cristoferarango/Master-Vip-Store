import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile, getProductForEdit } from "@/lib/actions/provider.actions";
import { getCategories } from "@/lib/actions/catalog.actions";
import { Card } from "@/components/ui/Card";
import { ProductForm } from "@/components/proveedores/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  const [product, categories] = await Promise.all([
    getProductForEdit(id, provider.id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-foreground">Editar producto</h1>
      <p className="mb-5 text-sm text-muted-foreground">{product.name}</p>
      <Card>
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          initial={{
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            imageUrl: product.imageUrl,
            description: product.description,
            conditions: product.conditions,
            price: product.price.toString(),
            durationDays: String(product.durationDays),
            type: product.type,
          }}
        />
      </Card>
    </div>
  );
}
