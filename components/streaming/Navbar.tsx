"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Library, LogOut, Menu, X, Home } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { NotificationsDropdown, type NotificationItem } from "./NotificationsDropdown";

export interface NavbarUser {
  name: string;
  avatarUrl?: string | null;
}

export function Navbar({
  user,
  notifications,
  unreadCount,
}: {
  user: NavbarUser | null;
  notifications?: NotificationItem[];
  unreadCount?: number;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <Link
          href="/"
          title="Ir al inicio de la tienda"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <Home size={15} className="animate-float" />
        </Link>

        <form action="/buscar" className="hidden flex-1 max-w-md items-center md:flex">
          <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <Search size={16} className="animate-wiggle text-muted-foreground" />
            <input
              name="q"
              placeholder="Buscar Netflix, Canva, ChatGPT..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/mis-compras"
                className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-border-strong sm:flex"
              >
                <ShoppingBag size={16} className="animate-wiggle" />
                <span className="hidden lg:inline">Mis compras</span>
              </Link>
              <Link
                href="/biblioteca"
                className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-border-strong sm:flex"
              >
                <Library size={16} className="animate-wiggle" />
                <span className="hidden lg:inline">Biblioteca</span>
              </Link>

              <NotificationsDropdown notifications={notifications ?? []} unreadCount={unreadCount ?? 0} />

              <Link href="/perfil" className="hidden sm:flex">
                <Avatar name={user.name} src={user.avatarUrl} size={36} />
              </Link>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="hidden rounded-xl p-2.5 text-muted-foreground hover:bg-surface hover:text-foreground sm:block"
              >
                <LogOut size={16} />
              </button>

              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                className="rounded-xl border border-border bg-surface p-2.5 text-foreground sm:hidden"
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </>
          ) : (
            <>
              <Link href="/registro" className="hidden sm:block">
                <Button size="sm" variant="secondary">Registrarse</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Iniciar sesión</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <div className="flex flex-col gap-1 border-t border-border px-4 py-3 sm:hidden">
          <Link
            href="/mis-compras"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            <ShoppingBag size={16} /> Mis compras
          </Link>
          <Link
            href="/biblioteca"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            <Library size={16} /> Biblioteca
          </Link>
          <Link
            href="/perfil"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            <Avatar name={user.name} size={20} /> Mi perfil
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-surface"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
