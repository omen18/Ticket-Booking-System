"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Ticket, CalendarClock, Info } from "lucide-react";
import { useNotificationStore, type AppNotification } from "@/lib/store/notificationStore";
import { useUserStore } from "@/lib/store/userStore";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const TYPE_ICON: Record<AppNotification["type"], React.ReactNode> = {
  booking: <Ticket size={14} />,
  upcoming: <CalendarClock size={14} />,
  reminder: <Info size={14} />,
};

const TYPE_COLOR: Record<AppNotification["type"], string> = {
  booking: "bg-emerald-100 text-emerald-700",
  upcoming: "bg-amber-100 text-amber-700",
  reminder: "bg-sky-100 text-sky-700",
};

export default function NotificationPanel() {
  const router = useRouter();
  const { isAuthed } = useUserStore();
  const { readIds, markRead, markAllRead, isRead } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !isRead(n.id)).length;

  useEffect(() => {
    if (!isAuthed) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((j) => setNotifications(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthed]);

  // Refresh on open
  useEffect(() => {
    if (!open || !isAuthed) return;
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((j) => setNotifications(j.data ?? []))
      .catch(() => {});
  }, [open, isAuthed]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleClick(n: AppNotification) {
    markRead(n.id);
    setOpen(false);
    router.push(n.href);
  }

  return (
    <div ref={panelRef} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="neu-raised flex h-9 w-9 items-center justify-center rounded-full"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Notifications"
      >
        <Bell size={15} className="text-[var(--text-secondary)]" />
      </motion.button>

      {/* Badge */}
      {unread > 0 && (
        <motion.span
          key={unread}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white"
        >
          {unread > 9 ? "9+" : unread}
        </motion.span>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-[0_20px_60px_rgba(8,48,71,0.16)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--accent-dark)]">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead(notifications.map((n) => n.id))}
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] transition hover:text-[var(--accent-dark)]"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-[var(--text-muted)]">
                  <Bell size={28} strokeWidth={1.5} />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}

              {!loading && notifications.map((n, i) => {
                const read = isRead(n.id);
                return (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleClick(n)}
                    className={`relative w-full px-4 py-3 text-left transition-colors hover:bg-[rgba(18,123,163,0.07)] ${
                      read ? "opacity-60" : ""
                    }`}
                  >
                    {/* Unread dot */}
                    {!read && (
                      <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                    )}

                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[n.type]}`}>
                        {TYPE_ICON[n.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-tight text-[var(--accent-dark)]">{n.title}</p>
                        <p className="mt-0.5 truncate text-[12px] text-[var(--text-secondary)]">{n.body}</p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{timeAgo(n.time)}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-[var(--border)] px-4 py-2.5">
                <button
                  onClick={() => { router.push("/profile/bookings"); setOpen(false); }}
                  className="text-[12px] font-medium text-[var(--accent)] transition hover:text-[var(--accent-dark)]"
                >
                  View all bookings →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
