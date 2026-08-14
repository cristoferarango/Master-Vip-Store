import Link from "next/link";
import { Home } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import {
  getMyProviderPurchaseNotifications,
  getUnreadProviderPurchaseNotificationCount,
  markProviderPurchaseNotificationsRead,
} from "@/lib/actions/notification.actions";
import { safeQuery } from "@/lib/db/safe";
import { PanelBackground } from "@/components/shared/PanelBackground";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";
import { NotificationsDropdown, type NotificationItem } from "@/components/streaming/NotificationsDropdown";

export default async function ProveedoresLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let notifications: NotificationItem[] = [];
  let unreadCount = 0;

  if (session) {
    // El panel de Proveedores solo avisa de solicitudes de compra nuevas —
    // filtrado por tipo, no las notificaciones que la cuenta recibe como
    // cliente. Si la base de datos no responde, el header simplemente se
    // muestra sin notificaciones en vez de tumbar todo el panel.
    const [{ data: notifs }, { data: unread }] = await Promise.all([
      safeQuery(() => getMyProviderPurchaseNotifications(session.userId), []),
      safeQuery(() => getUnreadProviderPurchaseNotificationCount(session.userId), 0),
    ]);
    notifications = notifs.map((n) => ({ ...n, href: "/proveedores/dashboard/solicitudes" }));
    unreadCount = unread;
  }

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
          <div className="ml-auto flex items-center gap-3">
            {session && (
              <NotificationsDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={markProviderPurchaseNotificationsRead}
              />
            )}
            <Link href="/streaming" className="text-sm text-muted-foreground hover:text-foreground">
              Ir a la tienda
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
