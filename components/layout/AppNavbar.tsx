"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import NotificationPanel from "@/components/layout/NotificationPanel";

export default function AppNavbar() {
  const router = useRouter();
  const { user, isAuthed, logout } = useUserStore();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 20));

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function signOut() {
    await logout();
    setAvatarOpen(false);
    router.push("/auth/login");
  }

  const navLinks = [
    ...(user?.role === "admin" ? [{ label: "Admin Panel", href: "/admin" }] : []),
    { label: "My Profile", href: "/profile" },
    { label: "My Bookings", href: "/profile/bookings" },
    { label: "My Reviews", href: "/profile/reviews" },
    { label: "Settings", href: "/profile/settings" },
  ];

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 w-full"
        animate={{
          height: scrolled ? 52 : 64,
          backgroundColor: scrolled ? "rgba(244,251,255,0.84)" : "rgba(244,251,255,0.98)",
          backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
          borderBottomColor: scrolled ? "rgba(204,227,239,1)" : "rgba(204,227,239,0.65)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ borderBottomWidth: 1, borderBottomStyle: "solid" }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Wordmark */}
          <motion.button
            onClick={() => router.push("/events")}
            className="font-sans font-bold tracking-widest text-[var(--accent-dark)]"
            animate={{ fontSize: scrolled ? "13px" : "15px" }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            BOOKING_SYSTEM
          </motion.button>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <motion.button
              className="neu-raised flex h-9 w-9 items-center justify-center rounded-full"
              whileHover={{ scale: 1.08, boxShadow: "8px 8px 16px #c8dfea, -8px -8px 16px #ffffff" }}
              whileTap={{ scale: 0.93 }}
            >
              <Search size={15} className="text-[var(--text-secondary)]" />
            </motion.button>

            {/* Bell — notification panel */}
            <NotificationPanel />

            {/* Auth — desktop */}
            {!isAuthed ? (
              <div className="hidden items-center gap-3 md:flex">
                <motion.button
                  onClick={() => router.push("/auth/login")}
                  className="text-sm font-medium text-[var(--accent-dark)]"
                  whileHover={{ color: "var(--accent)", x: 1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={() => router.push("/auth/register")}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
                  whileHover={{ scale: 1.04, backgroundColor: "#0d6080" }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  Register
                </motion.button>
              </div>
            ) : (
              <div ref={avatarRef} className="relative hidden md:block">
                <motion.button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white"
                  whileHover={{ scale: 1.1, boxShadow: "0 0 0 3px rgba(18,123,163,0.22)" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {initials}
                </motion.button>
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-[0_20px_60px_rgba(8,48,71,0.14)]"
                    >
                      {navLinks.map(({ label, href }, i) => (
                        <motion.button
                          key={href}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => { router.push(href); setAvatarOpen(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[var(--accent-dark)] transition-colors hover:bg-[rgba(18,123,163,0.09)]"
                        >
                          {label}
                        </motion.button>
                      ))}
                      <div className="my-1 border-t border-[var(--border)]" />
                      <motion.button
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: navLinks.length * 0.05 }}
                        onClick={signOut}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#DC2626] transition-colors hover:bg-[rgba(220,38,38,0.08)]"
                      >
                        Sign Out
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Hamburger — mobile */}
            <motion.button
              className="flex h-9 w-9 items-center justify-center rounded-full md:hidden"
              onClick={() => setMobileOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
            >
              <Menu size={20} className="text-[var(--accent-dark)]" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6 pb-10 pt-4 shadow-[0_-20px_60px_rgba(8,48,71,0.14)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-sans text-sm font-bold tracking-widest text-[var(--accent-dark)]">BOOKING_SYSTEM</span>
                <motion.button onClick={() => setMobileOpen(false)} whileTap={{ scale: 0.9 }}>
                  <X size={20} className="text-[var(--text-secondary)]" />
                </motion.button>
              </div>

              <div className="space-y-1 border-t border-[var(--border)] pt-4">
                {isAuthed ? (
                  <>
                    {navLinks.map(({ label, href }, i) => (
                      <motion.button
                        key={href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 28 }}
                        onClick={() => { router.push(href); setMobileOpen(false); }}
                        className="block w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-[var(--accent-dark)] transition-colors hover:bg-[rgba(18,123,163,0.09)]"
                      >
                        {label}
                      </motion.button>
                    ))}
                    <motion.button
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navLinks.length * 0.06 }}
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="mt-2 block w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-[#DC2626] hover:bg-[#fff0f0] transition-colors"
                    >
                      Sign Out
                    </motion.button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 pt-2">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                      onClick={() => { router.push("/auth/login"); setMobileOpen(false); }}
                      className="w-full rounded-xl border border-[var(--border)] py-3 text-sm font-medium text-[var(--accent-dark)]"
                    >
                      Sign In
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      onClick={() => { router.push("/auth/register"); setMobileOpen(false); }}
                      className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-white"
                    >
                      Register
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
