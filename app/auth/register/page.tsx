"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { Eye, EyeOff, ArrowRight, Check, User, Mail, Phone, Lock } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";

// ── Celebration overlay after register ───────────────────────────────────────
const CONFETTI_COLORS = ["#b65b3a", "#c47d50", "#f59e0b", "#22c55e", "#818cf8", "#f472b6"];

function Celebration({ name }: { name: string }) {
  const particles = Array.from({ length: 48 });

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0e0805]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
    >
      {/* Confetti burst */}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const dist = 120 + Math.random() * 200;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 4 + Math.random() * 6;
        return (
          <motion.div key={i}
            className="absolute rounded-sm"
            style={{ width: size, height: size, backgroundColor: color, top: "50%", left: "50%" }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              opacity: 0, rotate: angle * 2, scale: 0,
            }}
            transition={{ delay: 0.2 + (i % 8) * 0.04, duration: 1.1, ease: [0.2, 0.8, 0.4, 1] }}
          />
        );
      })}

      {/* Glow */}
      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(182,91,58,0.3) 0%, transparent 70%)" }}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.4, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Ticket icon */}
      <motion.div
        className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent)]"
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 280, damping: 18 }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55, type: "spring", stiffness: 400 }}>
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.p
        className="relative z-10 font-mono text-[11px] tracking-[0.3em] text-[var(--accent)]"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
      >
        ACCOUNT CREATED
      </motion.p>
      <motion.h2
        className="relative z-10 mt-3 font-syne text-5xl font-extrabold text-white"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, type: "spring", stiffness: 260, damping: 22 }}
      >
        You&apos;re in, {name.split(" ")[0]}!
      </motion.h2>
      <motion.p
        className="relative z-10 mt-3 text-sm text-white/40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
      >
        Redirecting to sign in…
      </motion.p>

      {/* Progress bar */}
      <motion.div className="relative z-10 mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-[var(--accent)]"
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ delay: 1.1, duration: 1.4, ease: "linear" }}
        />
      </motion.div>
    </motion.div>
  );
}

// ── Field component with animated label + icon ────────────────────────────────
function Field({ label, type, value, onChange, placeholder, icon: Icon, delay, error }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ElementType; delay: number; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 26 }}
    >
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
        {label}
      </label>
      <motion.div
        className="relative"
        animate={{ scale: focused ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <Icon size={14} />
        </div>
        <input
          type={isPassword && showPw ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          className="neu-pressed w-full rounded-xl py-3 pl-10 pr-10 text-sm text-[var(--accent-dark)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-shadow"
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent-dark)]"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Left decorative panel ─────────────────────────────────────────────────────
function LeftPanel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const lines = ref.current.querySelectorAll(".step-line");
    gsap.fromTo(lines,
      { scaleY: 0, transformOrigin: "top center" },
      { scaleY: 1, duration: 0.6, ease: "power3.out", stagger: 0.15, delay: 0.5 }
    );
  }, []);

  const steps = [
    { num: "01", title: "Create account", sub: "Name, email & password" },
    { num: "02", title: "Browse events", sub: "Movies, concerts, festivals" },
    { num: "03", title: "Pick your seat", sub: "Live interactive seat map" },
    { num: "04", title: "Get your ticket", sub: "Instant QR confirmation" },
  ];

  return (
    <div ref={ref} className="relative hidden overflow-hidden bg-[#071a27] lg:flex lg:w-[46%] lg:flex-col lg:justify-center lg:px-14">
      {/* Ambient */}
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#127ba3]/18 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-10 right-0 h-60 w-60 rounded-full bg-[#0d6080]/12 blur-[60px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(rgba(244,251,255,0.75) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <motion.p
        className="font-mono text-[11px] tracking-[0.25em] text-[var(--accent)]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      >
        HOW IT WORKS
      </motion.p>
      <motion.h2
        className="mt-4 font-syne text-4xl font-extrabold leading-tight text-white"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 22 }}
      >
        Your seat is<br />
        <span className="text-[var(--accent)]">3 steps away.</span>
      </motion.h2>

      <div className="mt-10 space-y-0">
        {steps.map((step, i) => (
          <motion.div key={step.num}
            className="flex gap-5"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
          >
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
                {step.num}
              </div>
              {i < steps.length - 1 && (
                <div className="step-line my-1 w-px flex-1 bg-[var(--accent)]/20" style={{ minHeight: 28 }} />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <p className="text-xs text-white/40">{step.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="mt-6 font-sans text-xs font-bold tracking-[0.25em] text-white/20"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
      >
        BOOKING_SYSTEM
      </motion.p>
    </div>
  );
}

// ── Main register page ────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [celebrated, setCelebrated] = useState<string | null>(null);

  function update(key: keyof typeof form) {
    return (v: string) => {
      setForm((f) => ({ ...f, [key]: v }));
      // Clear field error as user types
      setFieldErrors((e) => ({ ...e, [key]: "" }));
      setGlobalError("");
    };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Full name must be at least 2 characters";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.phone.trim()) errs.phone = "Enter your phone number";
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!form.confirm) errs.confirm = "Please confirm your password";
    else if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Highlight the email field specifically
          setFieldErrors((e) => ({ ...e, email: "This email is already registered" }));
          setGlobalError("already_exists");
        } else if (json.field) {
          setFieldErrors((e) => ({ ...e, [json.field]: json.error }));
        } else {
          setGlobalError(json.error ?? "Unable to create account. Please try again.");
        }
        return;
      }

      // ✓ Success: session cookie is set by API, hydrate Zustand store
      setUser({ user_id: json.data.user_id, name: json.data.name, email: json.data.email, phone: json.data.phone, role: "user" });
      setCelebrated(form.name.trim());
      setTimeout(() => router.push("/events"), 2000);
    } catch {
      setGlobalError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; type: string; placeholder: string; icon: React.ElementType; }[] = [
    { key: "name",     label: "Full name",        type: "text",     placeholder: "e.g. Yash Raj",       icon: User  },
    { key: "email",    label: "Email address",    type: "email",    placeholder: "you@example.com",     icon: Mail  },
    { key: "phone",    label: "Phone number",     type: "tel",      placeholder: "9876543210",           icon: Phone },
    { key: "password", label: "Password",         type: "password", placeholder: "Min. 6 characters",   icon: Lock  },
    { key: "confirm",  label: "Confirm password", type: "password", placeholder: "Repeat your password", icon: Lock  },
  ];

  return (
    <>
      <AnimatePresence>{celebrated && <Celebration name={celebrated} />}</AnimatePresence>

      <div className="flex min-h-screen">
        <LeftPanel />

        {/* ── RIGHT: form ── */}
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--bg-primary)] px-6 py-10">
          <div className="w-full max-w-[420px]">
            <motion.p
              className="font-mono text-[11px] tracking-[0.25em] text-[var(--accent)]"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            >
              CREATE ACCOUNT
            </motion.p>
            <motion.h1
              className="mt-2 font-syne text-4xl font-extrabold text-[var(--accent-dark)]"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
            >
              Join the system.
            </motion.h1>
            <motion.p
              className="mt-1.5 text-sm text-[var(--text-secondary)]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            >
              One account. Every event. Instant tickets.
            </motion.p>

            <form className="mt-7 space-y-3.5" onSubmit={handleSubmit}>
              {fields.map((f, i) => (
                <Field
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  value={form[f.key]}
                  onChange={update(f.key)}
                  placeholder={f.placeholder}
                  icon={f.icon}
                  delay={0.28 + i * 0.07}
                  error={fieldErrors[f.key]}
                />
              ))}

              {/* Global error banner */}
              <AnimatePresence>
                {globalError && (
                  <motion.div
                    key="gerr"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100"
                  >
                    {globalError === "already_exists" ? (
                      <span>
                        This email is already registered.{" "}
                        <Link href="/auth/login" className="font-semibold underline text-[var(--accent)]">
                          Sign in instead →
                        </Link>
                      </span>
                    ) : globalError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-1 w-full overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.975 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <motion.span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </motion.span>
                    ) : (
                      <><Check size={15} /> Create Account</>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="mt-5 flex items-center gap-2 text-sm text-[var(--text-secondary)]"
            >
              <span>Already have an account?</span>
              <motion.button
                onClick={() => router.push("/auth/login")}
                className="font-semibold text-[var(--accent)] hover:underline"
                whileHover={{ x: 2 }}
              >
                Sign in →
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
