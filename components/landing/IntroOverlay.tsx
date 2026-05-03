"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, Sparkles } from "lucide-react";

gsap.registerPlugin(SplitText);

const SESSION_KEY = "bmt_intro_seen";

function TicketLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
    >
      {/* Glow behind */}
      <ellipse cx="48" cy="52" rx="38" ry="26" fill="rgba(18,123,163,0.18)" />

      {/* Main ticket body */}
      <rect
        x="8" y="22" width="80" height="52" rx="12"
        fill="rgba(18,123,163,0.1)"
        stroke="rgba(53,168,214,0.65)"
        strokeWidth="1.5"
      />

      {/* Left notch */}
      <circle cx="8"  cy="48" r="9" fill="#071a27" stroke="rgba(53,168,214,0.4)" strokeWidth="1.5" />
      {/* Right notch */}
      <circle cx="88" cy="48" r="9" fill="#071a27" stroke="rgba(53,168,214,0.4)" strokeWidth="1.5" />

      {/* Perforated divider */}
      <line
        x1="30" y1="22" x2="30" y2="74"
        stroke="rgba(53,168,214,0.35)"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />

      {/* Left stub dot */}
      <circle cx="19" cy="48" r="4" fill="rgba(53,168,214,0.5)" />

      {/* Right content: star */}
      <path
        d="M58 33l3.1 9.6h10.1L63 48.3l3.1 9.6L58 52.2l-8.2 5.7 3.1-9.6-8.2-5.7h10.1z"
        fill="rgba(53,168,214,0.85)"
      />
    </svg>
  );
}

export default function IntroOverlay() {
  const [visible,  setVisible]  = useState(false);
  const [exiting,  setExiting]  = useState(false);
  const [gone,     setGone]     = useState(false);

  const titleRef   = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Only show once per session
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setGone(true);
      return;
    }
    setVisible(true);
  }, []);

  // Animate content in after overlay mounts
  useEffect(() => {
    if (!visible || !titleRef.current || !contentRef.current) return;

    const split = new SplitText(titleRef.current, { type: "chars" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(split.chars, {
      yPercent: 110,
      opacity: 0,
      rotateX: -60,
      transformOrigin: "50% 100%",
      stagger: 0.04,
      duration: 0.9,
      delay: 0.3,
    });

    tl.eventCallback("onComplete", () => split.revert());
    return () => { tl.kill(); split.revert(); };
  }, [visible]);

  function handleContinue() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setExiting(true);
    // Remove overlay fully after animation completes
    setTimeout(() => setGone(true), 1200);
  }

  if (gone) return null;
  if (!visible) return null;

  return (
    <AnimatePresence>
      {!gone && (
        <div className="fixed inset-0 z-[9990] overflow-hidden">

          {/* ── Content layer (fades out first) ── */}
          <motion.div
            ref={contentRef}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
            animate={exiting ? { opacity: 0, scale: 0.94, y: -24 } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Ambient orbs */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full blur-[100px]"
              style={{ background: "radial-gradient(circle, rgba(18,123,163,0.22) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-[380px] w-[380px] rounded-full blur-[80px]"
              style={{ background: "radial-gradient(circle, rgba(53,168,214,0.14) 0%, transparent 70%)" }} />

            {/* Dot grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(rgba(244,251,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
              className="relative mb-6"
            >
              {/* Pulse ring behind logo */}
              <motion.div
                className="absolute inset-0 rounded-full bg-[rgba(18,123,163,0.15)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <TicketLogo />
            </motion.div>

            {/* Brand name */}
            <div className="overflow-hidden">
              <h1
                ref={titleRef}
                className="font-syne text-[clamp(40px,8vw,88px)] font-extrabold leading-none tracking-tight text-white"
              >
                BookMyTickets
              </h1>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-4 font-mono text-[13px] tracking-[0.28em] text-[rgba(53,168,214,0.8)]"
            >
              EVERY SEAT · EVERY MOMENT
            </motion.p>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
              className="mt-8 h-px w-24 origin-left bg-gradient-to-r from-[var(--accent)] to-transparent"
            />

            {/* Continue button */}
            <motion.button
              onClick={handleContinue}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, type: "spring", stiffness: 280, damping: 22 }}
              whileHover={{ scale: 1.06, boxShadow: "0 0 0 6px rgba(18,123,163,0.2), 0 16px 40px rgba(18,123,163,0.4)" }}
              whileTap={{ scale: 0.96 }}
              className="group relative mt-10 flex items-center gap-3 overflow-hidden rounded-2xl border border-[rgba(53,168,214,0.4)] bg-[rgba(18,123,163,0.15)] px-8 py-4 text-base font-semibold text-white backdrop-blur-sm"
            >
              {/* Shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Sparkles size={16} className="text-[var(--accent-light)]" />
              <span>Continue</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={16} />
              </motion.span>
            </motion.button>

            {/* Scroll hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-8 font-mono text-[11px] tracking-[0.2em] text-[rgba(244,251,255,0.25)]"
            >
              BOOKING_SYSTEM · 2026
            </motion.p>
          </motion.div>

          {/* ── Top curtain panel ── */}
          <motion.div
            className="absolute inset-x-0 top-0 z-0 h-1/2 bg-[#071a27]"
            animate={exiting ? { y: "-102%" } : { y: 0 }}
            transition={{ duration: 0.85, delay: 0.28, ease: [0.76, 0, 0.24, 1] }}
          />

          {/* ── Bottom curtain panel ── */}
          <motion.div
            className="absolute inset-x-0 bottom-0 z-0 h-1/2 bg-[#071a27]"
            animate={exiting ? { y: "102%" } : { y: 0 }}
            transition={{ duration: 0.85, delay: 0.28, ease: [0.76, 0, 0.24, 1] }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
