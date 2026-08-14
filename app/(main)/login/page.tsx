import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/shared/LoginForm";

export default function StreamingLoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inicia sesión para comprar y ver tus cuentas.
        </p>
      </div>
      <Card>
        <LoginForm requiredCapability="any" redirectTo="/" />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Regístrate
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/recuperar" className="font-medium text-accent hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </div>
  );
}
