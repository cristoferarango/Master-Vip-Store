import { getSession } from "@/lib/auth/session";
import { getMyAccount } from "@/lib/actions/auth.actions";
import { Card } from "@/components/ui/Card";
import { AccountInfoCard } from "@/components/shared/AccountInfoCard";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";

export default async function VipPerfilPage() {
  const session = await getSession();
  if (!session) return null;

  const account = await getMyAccount(session.userId);
  if (!account) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Datos de tu cuenta de dueño.</p>
      </div>

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
