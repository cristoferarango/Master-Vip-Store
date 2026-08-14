import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/shared/LoginForm";

export default function ProveedoresHomePage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-10 py-6 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Vende tus cuentas en <span className="text-gradient">Master Vip Store</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Publica tus cuentas, gestiona tu stock y controla tus ventas y ganancias desde un solo
          panel. Los pagos se acreditan una vez que un cliente compra tu producto.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Aún no tienes cuenta de proveedor?{" "}
          <Link href="/provee/registro" className="font-medium text-accent hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-foreground">Iniciar sesión</h2>
        <p className="mb-5 text-sm text-muted-foreground">Ingresa a tu panel de proveedor.</p>
        <LoginForm
          requiredCapability="provider"
          redirectTo="/provee/dashboard"
          mismatchMessage="Esta cuenta no tiene un perfil de proveedor. Regístrate como proveedor primero."
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/recuperar" className="font-medium text-accent hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </Card>
    </div>
  );
}
