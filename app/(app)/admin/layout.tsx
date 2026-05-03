"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BarChart3, QrCode } from "lucide-react";

import { useUserStore } from "@/lib/store/userStore";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/scanner", label: "Ticket Scanner", icon: QrCode },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const isAuthed = useUserStore((s) => s.isAuthed);
  const bootstrapping = useUserStore((s) => s.bootstrapping);

  useEffect(() => {
    if (bootstrapping) return;
    if (!isAuthed) {
      router.push("/auth/login?returnUrl=/admin");
      return;
    }
    if (user?.role !== "admin") {
      router.push("/events");
    }
  }, [bootstrapping, isAuthed, router, user?.role]);

  if (bootstrapping) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]">
          Verifying admin access...
        </div>
      </div>
    );
  }

  if (!isAuthed || user?.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Tab nav */}
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(18,123,163,0.08)] hover:text-[var(--accent-dark)]"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
