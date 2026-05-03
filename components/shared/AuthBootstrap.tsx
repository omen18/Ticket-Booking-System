"use client";

// Mounts at the top of the app tree. Calls /api/auth/me to learn whether
// there's a valid session cookie and hydrates the Zustand store accordingly.
// Without this, refreshing any page logs the user out client-side even though
// the cookie is still valid.

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/userStore";

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const setBootstrapping = useUserStore((s) => s.setBootstrapping);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (json.data) {
          setUser({
            user_id: json.data.user_id,
            name: json.data.name,
            email: json.data.email,
            phone: json.data.phone,
            role: json.data.role,
          });
        } else {
          clearUser();
        }
      } catch {
        if (!cancelled) clearUser();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, clearUser, setBootstrapping]);

  return <>{children}</>;
}
