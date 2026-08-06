import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getMyNotifications, getUnreadNotificationCount } from "@/lib/actions/notification.actions";
import { safeQuery } from "@/lib/db/safe";
import { PanelBackground } from "@/components/shared/PanelBackground";
import { Navbar } from "@/components/streaming/Navbar";
import { BrandMarquee } from "@/components/streaming/BrandMarquee";

export default async function StreamingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let balance = 0;
  let notifications: Awaited<ReturnType<typeof getMyNotifications>> = [];
  let unreadCount = 0;

  if (session) {
    // Si la base de datos no responde, el navbar simplemente se muestra sin
    // saldo/notificaciones en vez de tumbar toda la sección /streaming.
    const [{ data: wallet }, { data: notifs }, { data: unread }] = await Promise.all([
      safeQuery(() => prisma.wallet.findUnique({ where: { userId: session.userId } }), null),
      safeQuery(() => getMyNotifications(session.userId), []),
      safeQuery(() => getUnreadNotificationCount(session.userId), 0),
    ]);
    balance = wallet ? Number(wallet.balance) : 0;
    notifications = notifs;
    unreadCount = unread;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <PanelBackground variant="streaming" />
      <Navbar
        user={session ? { name: session.name } : null}
        balance={balance}
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <BrandMarquee />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Master Vip Store — Cuentas streaming y servicios digitales.
      </footer>
    </div>
  );
}
