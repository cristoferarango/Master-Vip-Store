import { getSession } from "@/lib/auth/session";
import { getMyAccount } from "@/lib/actions/auth.actions";
import { getPlatformSettings } from "@/lib/actions/admin.actions";
import { Card } from "@/components/ui/Card";
import { AccountInfoCard } from "@/components/shared/AccountInfoCard";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import { PlatformScheduleForm } from "@/components/vip/PlatformScheduleForm";

export default async function VipPerfilPage() {
  const session = await getSession();
  if (!session) return null;

  const [account, platform] = await Promise.all([getMyAccount(session.userId), getPlatformSettings()]);
  if (!account) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Datos de tu cuenta de dueño.</p>
      </div>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-foreground">Horario general de la tienda</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Se aplica a toda la plataforma, encima del horario de cada proveedor.
        </p>
        <PlatformScheduleForm initialOpensAt={platform.opensAt} initialClosesAt={platform.closesAt} />
      </Card>

      <Card>
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
