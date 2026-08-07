import Link from "next/link";
import { Home } from "lucide-react";
import { PanelBackground } from "@/components/shared/PanelBackground";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";

export default function ProveedoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PanelBackground variant="proveedores" />
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <Link
            href="/proveedores/dashboard"
            title="Ir al resumen de tu panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
          >
            <Home size={15} className="animate-float" />
          </Link>
          <Badge tone="primary" className="hidden sm:inline-flex">
            Panel Proveedores
          </Badge>
          <Link href="/streaming" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Ir a la tienda
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
