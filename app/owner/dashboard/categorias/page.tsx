import { getAllCategoriesAdmin } from "@/lib/actions/category.actions";
import { Card } from "@/components/ui/Card";
import { CategoriesTable } from "@/components/vip/CategoriesTable";

export default async function CategoriasPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Edita los nombres e íconos de las plataformas que se muestran en la cinta del catálogo y en Biblioteca.
        </p>
      </div>

      <Card>
        <CategoriesTable
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            iconUrl: c.iconUrl,
            _count: c._count,
          }))}
        />
      </Card>
    </div>
  );
}
