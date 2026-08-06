import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/shared/RegisterForm";

export default function StreamingRegistroPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Regístrate para comprar cuentas y gestionar tu saldo.
        </p>
      </div>
      <Card>
        <RegisterForm kind="cliente" redirectTo="/streaming" />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/streaming/login" className="font-medium text-accent hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
