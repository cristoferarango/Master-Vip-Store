import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PasswordRecoveryForm } from "@/components/shared/PasswordRecoveryForm";
import { getSupportWhatsapp } from "@/lib/actions/auth.actions";
import { safeQuery } from "@/lib/db/safe";

export default async function RecuperarPage() {
  const { data: ownerWhatsapp } = await safeQuery(() => getSupportWhatsapp(), null);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escríbenos por WhatsApp con tus datos y te restablecemos el acceso.
        </p>
      </div>
      <Card>
        <PasswordRecoveryForm ownerWhatsapp={ownerWhatsapp} />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
