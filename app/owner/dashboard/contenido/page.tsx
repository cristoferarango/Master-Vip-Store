import { getSiteContent } from "@/lib/actions/admin.actions";
import { SiteContentForm } from "@/components/vip/SiteContentForm";

export default async function ContenidoPage() {
  const content = await getSiteContent();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Contenido del sitio</h1>
        <p className="text-sm text-muted-foreground">
          Edita los textos e íconos de las 3 tarjetas del inicio y el encabezado de Streaming.
        </p>
      </div>
      <SiteContentForm initial={content} />
    </div>
  );
}
