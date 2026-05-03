"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { Eye, EyeOff, ArrowRight, Ticket, Music, Film, Star } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";

// ── Floating card on the left panel ──────────────────────────────────────────
const CARDS = [
  { icon: Music,  label: "AR Rahman Concert",   sub: "Bangalore · May 5",  color: "from-violet-500 to-purple-700",  top: "8%",   left: "10%",  rotate: -6,  delay: 0 },
  { icon: Film,   label: "Avengers Night",       sub: "Chennai · Apr 10",  color: "from-rose-500 to-orange-600",    top: "34%",  left: "52%",  rotate: 4,   delay: 0.15 },
  { icon: Star,   label: "Spring Festival",      sub: "Delhi · Jul 15",    color: "from-amber-400 to-orange-500",   top: "62%",  left: "8%",   rotate: -3,  delay: 0.3 },
  { icon: Ticket, label: "Stand-up Comedy",      sub: "Mumbai · Jun 1",    color: "from-emerald-400 to-teal-600",   top: "78%",  left: "55%",  rotate: 5,   delay: 0.45 },
];

function FloatingCard({ card, index }: { card: typeof CARDS[0]; index: number }) {
  const Icon = card.icon;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 120, damping: 18 });
  const y = useSpring(rawY, { stiffness: 120, damping: 18 });

  // Idle float
  useEffect(() => {
    const tl = gsap.to({ v: 0 }, {
      v: 1, duration: 3 + index * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1,
      onUpdate: function () {
        rawY.set(Math.sin(this.progress() * Math.PI * 2) * 10);
        rawX.set(Math.cos(this.progress() * Math.PI) * 5);
      },
    });
    return () => { tl.kill(); };
  }, [index, rawX, rawY]);

  return (
    <motion.div
      className="absolute w-52 cursor-default select-none"
      style={{ top: card.top, left: card.left, x, y, rotate: card.rotate }}
      initial={{ opacity: 0, scale: 0.7, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: card.delay + 0.4, type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.06, zIndex: 20 }}
    >
      <div className={`rounded-2xl bg-gradient-to-br ${card.color} p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm`}>
        <div className="mb-2 flex items-center gap-2">
          <div className="rounded-lg bg-white/20 p-1.5">
            <Icon size={14} className="text-white" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Live Event</span>
        </div>
        <p className="text-sm font-bold text-white">{card.label}</p>
        <p className="mt-0.5 text-[11px] text-white/60">{card.sub}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/80">From ₹150</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">Book →</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Success burst overlay ─────────────────────────────────────────────────────
function SuccessBurst({ name }: { name: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a0f0a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Radial glow */}
      <motion.div
        className="absolute h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(182,91,58,0.35) 0%, transparent 70%)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Tick circle */}
      <motion.div
        className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]/10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <motion.path
            d="M8 20 L17 29 L32 12"
            stroke="#b65b3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>

      <motion.p
        className="relative z-10 font-mono text-[11px] tracking-[0.3em] text-[var(--accent)]"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      >
        AUTHENTICATED
      </motion.p>
      <motion.h2
        className="relative z-10 mt-3 font-syne text-4xl font-extrabold text-white"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }}
      >
        Welcome, {name.split(" ")[0]}
      </motion.h2>
      <motion.p
        className="relative z-10 mt-2 text-sm text-white/40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
      >
        Taking you to events…
      </motion.p>

      {/* Particle ring */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-[var(--accent)]"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i / 12) * Math.PI * 2) * 160,
            y: Math.sin((i / 12) * Math.PI * 2) * 160,
            opacity: 0, scale: 0,
          }}
          transition={{ delay: 0.3 + i * 0.03, duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

// ── Main login page ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, isAuthed } = useUserStore();

  // If already logged in, skip login page entirely
  useEffect(() => {
    if (isAuthed) router.replace(params.get("returnUrl") ?? "/events");
  }, [isAuthed, router, params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ name: string } | null>(null);

  const leftRef = useRef<HTMLDivElement>(null);

  // Ambient orbs on left panel
  useEffect(() => {
    if (!leftRef.current) return;
    const orbs = leftRef.current.querySelectorAll(".orb");
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        x: `random(-30, 30)`, y: `random(-40, 40)`,
        duration: 4 + i * 1.2, ease: "sine.inOut",
        yoyo: true, repeat: -1,
      });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Invalid credentials"); return; }
      setUser(json.data);
      setSuccess({ name: json.data.name });
      setTimeout(() => {
        if (json.data.role === "admin") {
          router.push("/admin");
          return;
        }
        router.push(params.get("returnUrl") ?? "/events");
      }, 2200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { id: "email", label: "Email address", type: showPw ? "text" : "email", value: email, onChange: setEmail, placeholder: "you@example.com" },
    { id: "password", label: "Password", type: showPw ? "text" : "password", value: password, onChange: setPassword, placeholder: "Your password" },
  ];

  return (
    <>
      <AnimatePresence>{success && <SuccessBurst name={success.name} />}</AnimatePresence>

      <div className="flex min-h-screen">
        {/* ── LEFT: visual panel ── */}
        <div ref={leftRef} className="relative hidden overflow-hidden bg-[#071a27] lg:flex lg:w-[52%]">
          {/* Ambient orbs */}
          {[
            { cls: "orb absolute h-96 w-96 rounded-full blur-[80px] bg-[#127ba3]/24", style: { top: "-10%", left: "-10%" } },
            { cls: "orb absolute h-72 w-72 rounded-full blur-[60px] bg-[#0d6080]/16", style: { bottom: "5%", right: "-5%" } },
            { cls: "orb absolute h-48 w-48 rounded-full blur-[50px] bg-[#35a8d6]/12", style: { top: "45%", left: "40%" } },
          ].map((o, i) => <div key={i} className={o.cls} style={o.style} />)}

          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(rgba(244,251,255,0.75) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />

          {/* Floating cards */}
          <div className="relative h-full w-full">
            {CARDS.map((card, i) => <FloatingCard key={i} card={card} index={i} />)}
          </div>

          {/* Bottom wordmark */}
          <motion.div
            className="absolute bottom-8 left-8"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          >
            <p className="font-sans text-sm font-bold tracking-[0.25em] text-white/30">BOOKING_SYSTEM</p>
            <p className="mt-1 text-xs text-white/20">Your seat is waiting.</p>
          </motion.div>
        </div>

        {/* ── RIGHT: form panel ── */}
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
          <div className="w-full max-w-[400px]">
            {/* Header stagger */}
            <motion.p
              className="font-mono text-[11px] tracking-[0.25em] text-[var(--accent)]"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            >
              SIGN IN
            </motion.p>
            <motion.h1
              className="mt-3 font-syne text-4xl font-extrabold text-[var(--accent-dark)]"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: "spring", stiffness: 300, damping: 24 }}
            >
              Welcome back.
            </motion.h1>
            <motion.p
              className="mt-2 text-sm text-[var(--text-secondary)]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            >
              Sign in to access your tickets and bookings.
            </motion.p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {fields.map((f, i) => (
                <motion.div key={f.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.1, type: "spring", stiffness: 320, damping: 26 }}
                >
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    {f.label}
                  </label>
                  <div className="relative">
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      placeholder={f.placeholder}
                      required
                      className="neu-pressed w-full rounded-xl px-4 py-3 text-sm text-[var(--accent-dark)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-shadow"
                    />
                    {f.id === "password" && (
                      <button type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent-dark)]"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600"
                  >
                    {error}
                    {error.toLowerCase().includes("password") || error.toLowerCase().includes("invalid") ? (
                      <span className="block mt-1 text-xs text-[var(--text-muted)]">
                        New here?{" "}
                        <Link href="/auth/register" className="font-semibold text-[var(--accent)] underline">
                          Create an account →
                        </Link>
                      </span>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {/* Shimmer */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <motion.span className="flex gap-1">
                        {[0,1,2].map((i) => (
                          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white"
                            animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </motion.span>
                    ) : (
                      <>Sign In <ArrowRight size={15} /></>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            {/* Quick demo login hint */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">Quick demo accounts</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Yash",  email: "yash1@gmail.com",  pw: "pass123" },
                  { name: "Rahul", email: "rahul2@gmail.com", pw: "pass123" },
                  { name: "Rohan", email: "rohan@gmail.com",  pw: "pass123" },
                ].map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => { setEmail(demo.email); setPassword(demo.pw); }}
                    className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--accent-dark)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    {demo.name}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">Click a name to auto-fill · password: <span className="font-mono font-bold">pass123</span></p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="mt-6 flex items-center gap-2 text-sm text-[var(--text-secondary)]"
            >
              <span>Don&apos;t have an account?</span>
              <motion.button
                onClick={() => router.push("/auth/register")}
                className="font-semibold text-[var(--accent)] hover:underline"
                whileHover={{ x: 2 }}
              >
                Register →
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
