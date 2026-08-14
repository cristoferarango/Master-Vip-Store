import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/shared/LoginForm";

export default function VipHomePage() {
  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Acceso restringido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Panel exclusivo del dueño de Master Vip Store.
        </p>
      </div>
      <Card>
        <LoginForm
          requiredCapability="admin"
          redirectTo="/owner/dashboard"
          mismatchMessage="Esta cuenta no tiene acceso al Panel VIP."
        />
      </Card>
    </div>
  );
}
