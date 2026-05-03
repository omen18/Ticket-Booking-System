"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthed = useUserStore((s) => s.isAuthed);
  const bootstrapping = useUserStore((s) => s.bootstrapping);

  useEffect(() => {
    if (!bootstrapping && !isAuthed) {
      router.push("/auth/login?returnUrl=/profile");
    }
  }, [bootstrapping, isAuthed, router]);

  // Show loading skeleton while we check the cookie
  if (bootstrapping) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <section>{children}</section>
    </div>
  );
}
