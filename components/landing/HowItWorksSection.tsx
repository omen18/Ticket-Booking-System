"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, Grid3X3, Lock, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function StepTag({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.76)] px-3 py-1 font-mono text-[13px] text-[var(--text-secondary)]">
      <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      {children}
    </span>
  );
}

function EventRowsMock() {
  const rows = [
    { name: "AR Rahman Concert", date: "05 MAY", color: "bg-[var(--accent)]" },
    { name: "Avengers Movie Night", date: "10 APR", color: "bg-[#22C55E]" },
    { name: "Spring Festival", date: "15 JUL", color: "bg-[#F59E0B]" },
  ];

  return (
    <div className="w-full max-w-[360px] rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.76)] p-4 shadow-[0_16px_40px_rgba(8,48,71,0.08)]">
      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[rgba(18,123,163,0.08)] px-3 py-2 text-xs text-[var(--text-secondary)]">Search events, artists, cities...</div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg bg-[rgba(18,123,163,0.06)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${row.color}`} />
              <span className="text-xs text-[var(--accent-dark)]">{row.name}</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">{row.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatMapMock() {
  const seats = Array.from({ length: 16 }, (_, index) => {
    if (index === 5 || index === 10) {
      return "selected";
    }

    if (index === 2 || index === 14) {
      return "available";
    }

    return "booked";
  });

  return (
    <div className="w-full max-w-[320px] rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.76)] p-5 shadow-[0_16px_40px_rgba(8,48,71,0.08)]">
      <div className="mb-3 text-center text-[11px] tracking-[0.25em] text-[var(--text-muted)]">SCREEN</div>
      <div className="mx-auto mb-5 h-2 w-40 rounded-[999px] border border-[rgba(8,48,71,0.14)] border-t-[rgba(18,123,163,0.45)]" />

      <div className="grid grid-cols-[16px_repeat(4,1fr)] gap-2 text-center">
        {["A", "B", "C", "D"].map((row, rowIndex) => (
          <div key={`row-${row}`} className="contents">
            <span key={`label-${row}`} className="font-mono text-[10px] text-[var(--text-muted)]">
              {row}
            </span>
            {seats.slice(rowIndex * 4, rowIndex * 4 + 4).map((seat, index) => (
              <span
                key={`${row}-${index}`}
                className={`h-4 w-4 rounded-[5px] ${
                  seat === "booked"
                    ? "bg-[#D6C8BB]"
                    : seat === "selected"
                      ? "bg-[var(--accent)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
                      : "bg-[#22C55E] shadow-[1px_1px_4px_rgba(0,0,0,0.1)]"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentMock() {
  return (
    <div className="w-[240px] rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.76)] p-4 shadow-[0_16px_40px_rgba(8,48,71,0.08)]">
      <p className="font-mono text-base tracking-[0.18em] text-[var(--accent-dark)]">•••• •••• •••• 4242</p>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-mono text-[12px] text-[var(--text-muted)]">VISA</span>
        <span className="text-xs text-[#86EFAC]">🔒</span>
      </div>
      <span className="mt-4 inline-flex rounded-full bg-[#22C55E]/15 px-2.5 py-1 text-[11px] text-[#86EFAC]">Verified by Bank</span>
    </div>
  );
}

function TicketMock() {
  return (
    <div className="w-[280px] rotate-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.76)] p-5 shadow-[0_16px_40px_rgba(8,48,71,0.08)]">
      <p className="text-sm font-semibold text-[var(--accent-dark)]">AR Rahman Concert</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Seat B12 • Booking #82713</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-14 w-14 rounded-md bg-[rgba(18,123,163,0.1)]" />
        <span className="rounded-full bg-[#22C55E]/20 px-3 py-1 text-xs text-[#86EFAC]">Confirmed</span>
      </div>
    </div>
  );
}

interface StepPanelProps {
  stepNumber: string;
  icon: ReactNode;
  title: string;
  body: string;
  tag?: string;
  children: ReactNode;
}

function StepPanel({ stepNumber, icon, title, body, tag, children }: StepPanelProps) {
  return (
    <section className="relative flex h-full w-screen items-center px-8 py-8 md:px-20">
      <span className="pointer-events-none absolute left-8 top-10 select-none font-display text-[160px] font-extrabold leading-none text-[rgba(8,48,71,0.08)] md:left-20 md:text-[200px]">
        {stepNumber}
      </span>

      <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="relative z-10 lg:col-span-7">
          <div className="inline-flex rounded-2xl border border-[rgba(18,123,163,0.24)] bg-[rgba(18,123,163,0.12)] p-5 text-[var(--accent-strong)] shadow-[0_0_40px_rgba(18,123,163,0.16)]">
            {icon}
          </div>

          <h3 className="mt-7 font-display text-[clamp(34px,4vw,48px)] font-bold leading-[1.05] text-[var(--accent-dark)]">{title}</h3>
          <p className="mt-4 max-w-[460px] text-[17px] leading-[1.7] text-[var(--text-secondary)]">{body}</p>
          {tag ? <div className="mt-6"><StepTag>{tag}</StepTag></div> : null}
        </div>

        <div className="flex items-center justify-center lg:col-span-5">{children}</div>
      </div>
    </section>
  );
}

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const panel4Ref = useRef<HTMLElement | null>(null);
  const checkPathRef = useRef<SVGPathElement | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  const { scrollYProgress } = useScroll();
  const parallaxX = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useGSAP(
    () => {
      const pin = pinRef.current;
      const track = trackRef.current;

      if (!pin || !track) {
        return;
      }

      const totalWidth = Math.max(0, track.scrollWidth - window.innerWidth);

      if (totalWidth <= 0) {
        return;
      }

      const tween = gsap.to(track, {
        x: -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${totalWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const normalized = Math.min(0.9999, self.progress);
            const step = Math.min(4, Math.floor(normalized * 4) + 1);
            setActiveStep(step);
          },
        },
      });

      const checkPath = checkPathRef.current;
      const panel4 = panel4Ref.current;

      if (checkPath && panel4) {
        const length = checkPath.getTotalLength();
        gsap.set(checkPath, { strokeDasharray: length, strokeDashoffset: length });

        ScrollTrigger.create({
          trigger: panel4,
          containerAnimation: tween,
          start: "left center",
          once: true,
          onEnter: () => {
            gsap.to(checkPath, {
              strokeDashoffset: 0,
              duration: 1,
              ease: "power2.out",
            });
          },
        });
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative -mt-[60px] overflow-hidden bg-[#dff2fa]"
      style={{ clipPath: "polygon(0 0, 100% 60px, 100% 100%, 0 100%)" }}
    >
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-24 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--accent)]">THE PROCESS</p>
        <h2 className="mt-4 max-w-[600px] font-display text-[clamp(44px,6vw,64px)] font-extrabold leading-[1.02] text-[var(--accent-dark)]">
          From browse
          <br />
          to your seat
          <br />
          in minutes.
        </h2>
      </div>

      <div ref={pinRef} className="relative h-[100svh] overflow-hidden">
        <div ref={trackRef} className="flex h-full w-[400vw]">
          <StepPanel
            stepNumber="01"
            icon={<Search className="h-10 w-10" />}
            title="Find Your Event"
            body="Browse movies, concerts, sports and theater. Filter by city (Venue.location), date (Event.event_date), or category (Category.category_name)."
            tag="5 categories · 5 cities"
          >
            <motion.div style={{ x: parallaxX }}>
              <EventRowsMock />
            </motion.div>
          </StepPanel>

          <StepPanel
            stepNumber="02"
            icon={<Grid3X3 className="h-10 w-10" />}
            title="Pick Your Seat"
            body="Interactive seat map from the Seat table. UNIQUE(seat_id, event_id) constraint prevents any seat being booked twice. Seats lock for 10 minutes during checkout."
          >
            <SeatMapMock />
          </StepPanel>

          <StepPanel
            stepNumber="03"
            icon={<Lock className="h-10 w-10" />}
            title="Pay Securely"
            body="Card or Net Banking with OTP verification. Payment inserted into Payment table (one-to-one with Booking via UNIQUE booking_id). SSL encrypted, sub-30 second flow."
          >
            <PaymentMock />
          </StepPanel>

          <section ref={panel4Ref} className="relative flex h-full w-screen items-center px-8 py-8 md:px-20">
            <span className="pointer-events-none absolute left-8 top-10 select-none font-display text-[160px] font-extrabold leading-none text-[rgba(8,48,71,0.08)] md:left-20 md:text-[200px]">
              04
            </span>

            <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="relative z-10 lg:col-span-7">
                <div className="inline-flex rounded-2xl border border-[rgba(18,123,163,0.24)] bg-[rgba(18,123,163,0.12)] p-5 text-[var(--accent-strong)] shadow-[0_0_40px_rgba(18,123,163,0.16)]">
                  <CheckCircle2 className="h-11 w-11" />
                </div>

                <div className="mt-6 w-24">
                  <svg viewBox="0 0 100 70" className="w-full">
                    <path ref={checkPathRef} d="M12 40 L36 62 L90 8" fill="none" stroke="#127ba3" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h3 className="mt-3 font-display text-[clamp(34px,4vw,48px)] font-bold leading-[1.05] text-[var(--accent-dark)]">You&apos;re In.</h3>
                <p className="mt-4 max-w-[460px] text-[17px] leading-[1.7] text-[var(--text-secondary)]">
                  Booking ID generated. Ticket row inserted with unique QR code. Confirmation sent to your email instantly.
                </p>
              </div>

              <div className="flex items-center justify-center lg:col-span-5">
                <TicketMock />
              </div>
            </div>
          </section>
        </div>

        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4].map((dot) => (
              <span
                key={`dot-${dot}`}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                  activeStep === dot
                    ? "scale-125 bg-[var(--accent)] shadow-[0_0_14px_rgba(18,123,163,0.45)]"
                    : "bg-[rgba(8,48,71,0.2)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
