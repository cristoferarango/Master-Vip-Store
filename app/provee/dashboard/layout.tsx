import { requireProviderSession } from "@/lib/auth/rbac";
import { getMyProviderProfile } from "@/lib/actions/provider.actions";
import { ProviderSidebar } from "@/components/proveedores/ProviderSidebar";
import { Card } from "@/components/ui/Card";
import { Clock3, Ban } from "lucide-react";

export default async function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireProviderSession("/provee");
  const provider = await getMyProviderProfile(session.userId);

  if (!provider) {
    return (
      <Card className="mx-auto max-w-md text-center text-sm text-muted-foreground">
        No encontramos tu perfil de proveedor. Contáctanos por soporte.
      </Card>
    );
  }

  if (provider.status === "PENDIENTE") {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Clock3 size={22} />
        </span>
        <h1 className="text-lg font-semibold text-foreground">Tu cuenta está en revisión</h1>
        <p className="text-sm text-muted-foreground">
          Un administrador debe activar tu cuenta de proveedor antes de que puedas publicar
          productos y empezar a vender. Te avisaremos por WhatsApp apenas esté lista.
        </p>
      </Card>
    );
  }

  if (provider.status === "SUSPENDIDO") {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
          <Ban size={22} />
        </span>
        <h1 className="text-lg font-semibold text-foreground">Cuenta suspendida</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta de proveedor fue suspendida. Contáctanos si crees que es un error.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <ProviderSidebar businessName={provider.businessName} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
