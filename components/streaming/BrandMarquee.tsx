import { getCategories } from "@/lib/actions/catalog.actions";
import { safeQuery } from "@/lib/db/safe";

function BrandChip({ name, icon }: { name: string; icon?: string | null }) {
  return (
    <span className="mx-3 flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground">
      {icon && <span aria-hidden="true">{icon}</span>}
      {name}
    </span>
  );
}

/** Barra animada infinita con las plataformas configuradas desde el Panel VIP. */
export async function BrandMarquee() {
  const { data: categories } = await safeQuery(() => getCategories(), []);
  if (categories.length === 0) return null;

  const items = [...categories, ...categories];

  return (
    <div className="relative overflow-hidden border-y border-border bg-background-elevated/60 py-3">
      <div className="flex w-max animate-marquee">
        {items.map((c, i) => (
          <BrandChip key={`${c.id}-${i}`} name={c.name} icon={c.icon} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
