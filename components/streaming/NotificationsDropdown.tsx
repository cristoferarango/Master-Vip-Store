"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";
import { formatDatePE } from "@/lib/utils/dates";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationsDropdown({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllNotificationsRead();
      router.refresh();
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="press-feedback relative rounded-xl border border-border bg-surface p-2.5 text-foreground transition-colors duration-150 hover:border-border-strong"
      >
        <Bell size={16} className="animate-wiggle" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="popover-in glass-card absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-background-elevated p-2 shadow-2xl">
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notificaciones
            </p>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No tienes notificaciones todavía.
                </p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="rounded-xl px-2.5 py-2 hover:bg-surface">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatDatePE(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
