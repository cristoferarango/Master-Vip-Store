const BRANDS = ["Netflix", "HBO Max", "Canva", "ChatGPT", "Gemini", "Claude", "IPTV", "Disney+", "Spotify"];

function BrandChip({ name }: { name: string }) {
  return (
    <span className="mx-3 flex shrink-0 items-center rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground">
      {name}
    </span>
  );
}

/** Barra animada infinita con los nombres de las plataformas disponibles. */
export function BrandMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-border bg-background-elevated/60 py-3">
      <div className="flex w-max animate-marquee">
        {[...BRANDS, ...BRANDS].map((brand, i) => (
          <BrandChip key={`${brand}-${i}`} name={brand} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
