"use client";

import gsap from "gsap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import Button from "@/components/ui/Button";

const sectionLinks = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Events", id: "events" },
  { label: "Reviews", id: "reviews" },
];

const mobileLinks = [...sectionLinks, { label: "Sign In", href: "/auth/login" }, { label: "Book Now", href: "/events" }];

const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

export default function LandingNav() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { scrollY } = useScroll();
  const backgroundColor = useTransform(scrollY, [0, 80], ["rgba(230,244,251,0)", "rgba(244,251,255,0.9)"]);
  const borderBottomColor = useTransform(scrollY, [0, 80], ["rgba(8,48,71,0)", "rgba(8,48,71,0.08)"]);
  const blurValue = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(20px)"]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 80);
  });

  const topLineRef = useRef<HTMLSpanElement | null>(null);
  const middleLineRef = useRef<HTMLSpanElement | null>(null);
  const bottomLineRef = useRef<HTMLSpanElement | null>(null);
  const mobileOverlayRef = useRef<HTMLDivElement | null>(null);
  const mobileLinkRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const top = topLineRef.current;
    const middle = middleLineRef.current;
    const bottom = bottomLineRef.current;
    const overlay = mobileOverlayRef.current;
    const links = mobileLinkRefs.current.filter(Boolean) as HTMLButtonElement[];

    if (!top || !middle || !bottom || !overlay) {
      return;
    }

    const timeline = gsap.timeline({ defaults: { duration: 0.35, ease: "power2.out" } });

    if (isMobileOpen) {
      gsap.set(overlay, { pointerEvents: "auto" });

      timeline
        .to(top, { y: 7, rotate: 45 }, 0)
        .to(middle, { opacity: 0 }, 0)
        .to(bottom, { y: -7, rotate: -45 }, 0)
        .to(
          overlay,
          {
            clipPath: "circle(150% at calc(100% - 34px) 34px)",
            duration: 0.5,
            ease: "power2.inOut",
          },
          0,
        )
        .fromTo(
          links,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: "power3.out" },
          0.12,
        );
    } else {
      timeline
        .to(top, { y: 0, rotate: 0 }, 0)
        .to(middle, { opacity: 1 }, 0)
        .to(bottom, { y: 0, rotate: 0 }, 0)
        .to(
          overlay,
          {
            clipPath: "circle(0% at calc(100% - 34px) 34px)",
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => gsap.set(overlay, { pointerEvents: "none" }),
          },
          0,
        );
    }

    return () => {
      timeline.kill();
    };
  }, [isMobileOpen]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);

    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMobileOpen(false);
  };

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 22, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 260, damping: 22, mass: 0.4 });

  return (
    <>
      <motion.nav
        className="fixed inset-x-0 top-0 z-50 border-b transition-all duration-[400ms] ease-in-out"
        style={{
          backgroundColor,
          borderBottomColor,
          backdropFilter: blurValue,
          WebkitBackdropFilter: blurValue,
        }}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className={`font-display text-[18px] font-bold tracking-[0.02em] text-[var(--accent-dark)] transition-colors duration-300 hover:text-[var(--accent)] ${
              isScrolled ? "text-[var(--accent-dark)]" : "text-[var(--accent-dark)]"
            }`}
          >
            BOOKING_SYSTEM
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {sectionLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="group relative text-sm text-[rgba(13,42,61,0.72)] transition-opacity duration-300 hover:text-[var(--accent-dark)]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[rgba(8,48,71,0.18)] px-5 text-sm font-medium text-[var(--accent-dark)] transition-colors duration-300 hover:bg-[var(--accent-dark)] hover:text-white"
            >
              Sign In
            </Link>

            <motion.div
              style={{ x, y }}
              onMouseMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const offsetX = event.clientX - (bounds.left + bounds.width / 2);
                const offsetY = event.clientY - (bounds.top + bounds.height / 2);

                rawX.set(lerp(rawX.get(), offsetX * 0.2, 0.32));
                rawY.set(lerp(rawY.get(), offsetY * 0.2, 0.32));
              }}
              onMouseLeave={() => {
                rawX.set(0);
                rawY.set(0);
              }}
            >
              <Button
                className="h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
                onClick={() => router.push("/events")}
              >
                Book Now
              </Button>
            </motion.div>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            className="relative z-[60] flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-lg border border-[rgba(8,48,71,0.18)] bg-[rgba(244,251,255,0.88)] md:hidden"
            onClick={() => setIsMobileOpen((open) => !open)}
          >
            <span ref={topLineRef} className="h-[2px] w-5 rounded bg-[var(--accent-dark)]" />
            <span ref={middleLineRef} className="h-[2px] w-5 rounded bg-[var(--accent-dark)]" />
            <span ref={bottomLineRef} className="h-[2px] w-5 rounded bg-[var(--accent-dark)]" />
          </button>
        </div>
      </motion.nav>

      <div
        ref={mobileOverlayRef}
        className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-secondary)] md:hidden"
        style={{ clipPath: "circle(0% at calc(100% - 34px) 34px)", pointerEvents: "none" }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsMobileOpen(false);
          }
        }}
      >
        <div className="flex w-full flex-col items-center gap-8 px-8">
          {mobileLinks.map((link, index) => {
            const onClick = () => {
              if ("id" in link) {
                scrollToSection(link.id);
                return;
              }

              router.push(link.href);
              setIsMobileOpen(false);
            };

            return (
              <button
                key={`${link.label}-${index}`}
                ref={(element) => {
                  mobileLinkRefs.current[index] = element;
                }}
                type="button"
                className="text-2xl font-display font-bold tracking-wide text-[var(--accent-dark)]"
                onClick={onClick}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
