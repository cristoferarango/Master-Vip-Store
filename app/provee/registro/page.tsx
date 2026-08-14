import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/shared/RegisterForm";

export default function ProveedoresRegistroPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Regístrate como proveedor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu cuenta quedará pendiente de aprobación antes de poder publicar productos.
        </p>
      </div>
      <Card>
        <RegisterForm
          kind="proveedor"
          redirectTo="/provee/dashboard"
          successNote="Un administrador revisará tu solicitud antes de que puedas vender."
        />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/provee" className="font-medium text-accent hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
