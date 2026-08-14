"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Receipt, UserCircle, LogOut, ReceiptText, Tags, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/owner/dashboard", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/owner/dashboard/solicitudes", label: "Solicitudes", icon: ReceiptText },
  { href: "/owner/dashboard/usuarios", label: "Usuarios", icon: Users },
  { href: "/owner/dashboard/proveedores", label: "Proveedores", icon: Store },
  { href: "/owner/dashboard/categorias", label: "Categorías", icon: Tags },
  { href: "/owner/dashboard/contenido", label: "Contenido", icon: LayoutTemplate },
  { href: "/owner/dashboard/ventas", label: "Ventas", icon: Receipt },
  { href: "/owner/dashboard/perfil", label: "Perfil", icon: UserCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/owner");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-border pb-4 md:w-56 md:border-b-0 md:border-r md:pb-0 md:pr-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-accent"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
          >
            <Icon size={16} className="animate-wiggle" />
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </aside>
  );
}
