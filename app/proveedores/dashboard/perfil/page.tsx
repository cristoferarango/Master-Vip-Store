import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile } from "@/lib/actions/provider.actions";
import { Card } from "@/components/ui/Card";
import { ProviderProfileForm } from "@/components/proveedores/ProviderProfileForm";

export default async function ProviderProfilePage() {
  const session = await getSession();
  if (!session) return null;
  const provider = await getMyProviderProfile(session.userId);
  if (!provider) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold text-foreground">Tu perfil</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Así te ven tus clientes en el catálogo y en la ficha de producto.
      </p>
      <Card>
        <ProviderProfileForm
          initialBusinessName={provider.businessName}
          initialBio={provider.bio ?? ""}
          initialAvatarUrl={provider.avatarUrl}
        />
      </Card>
    </div>
  );
}
