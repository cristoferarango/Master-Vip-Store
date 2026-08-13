import { getSession } from "@/lib/auth/session";
import { getMyProviderProfile } from "@/lib/actions/provider.actions";
import { getMyAccount } from "@/lib/actions/auth.actions";
import { Card } from "@/components/ui/Card";
import { ProviderProfileForm } from "@/components/proveedores/ProviderProfileForm";
import { ProviderPaymentForm } from "@/components/proveedores/ProviderPaymentForm";
import { ProviderScheduleForm } from "@/components/proveedores/ProviderScheduleForm";
import { AccountInfoCard } from "@/components/shared/AccountInfoCard";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";

export default async function ProviderProfilePage() {
  const session = await getSession();
  if (!session) return null;
  const [provider, account] = await Promise.all([
    getMyProviderProfile(session.userId),
    getMyAccount(session.userId),
  ]);
  if (!provider || !account) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold text-foreground">Tu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Así te ven tus clientes en el catálogo y en la ficha de producto.
        </p>
      </div>

      <Card>
        <ProviderProfileForm
          initialBusinessName={provider.businessName}
          initialBio={provider.bio ?? ""}
          initialAvatarUrl={provider.avatarUrl}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-foreground">Cómo te pagan tus clientes</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Cuando alguien compre, verá este QR y estos datos para pagarte directo por Yape.
        </p>
        <ProviderPaymentForm
          initialYapeNumber={provider.yapeNumber}
          initialYapeName={provider.yapeName}
          initialYapeQrUrl={provider.yapeQrUrl}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-foreground">Horario de atención</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Cuándo estás disponible para recibir y aprobar solicitudes de compra.
        </p>
        <ProviderScheduleForm initialOpensAt={provider.opensAt} initialClosesAt={provider.closesAt} />
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Datos de tu cuenta</h2>
        <AccountInfoCard
          name={account.name}
          email={account.email}
          whatsapp={account.whatsapp}
          createdAt={account.createdAt}
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
