"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { motion, MotionValue, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { Calendar, ChevronDown, MapPin, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils/formatDate";

gsap.registerPlugin(SplitText);

interface EventCardItem {
  category: string;
  isToday?: boolean;
  event_name: string;
  venue_name: string;
  event_date: string;
  seats_left: number;
}

interface FloatingEventCardProps {
  data: EventCardItem;
  top: number;
  right: number;
  rotate: number;
  y: MotionValue<number>;
}

function FloatingEventCard({ data, top, right, rotate, y }: FloatingEventCardProps) {
  const baseRotateX = useMotionValue(0);
  const baseRotateY = useMotionValue(0);
  const rotateX = useSpring(baseRotateX, { stiffness: 300, damping: 24 });
  const rotateY = useSpring(baseRotateY, { stiffness: 300, damping: 24 });

  return (
    <motion.article
      className="absolute w-[280px] rounded-[20px] border border-[#cce3ef] bg-[rgba(244,251,255,0.84)] p-5 text-[var(--text-primary)] backdrop-blur-xl"
      style={{ top, right, y, rotate, rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{
        scale: 1.03,
        borderColor: "rgba(18,123,163,0.4)",
        transition: { type: "spring", stiffness: 300, damping: 22 },
      }}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - (bounds.left + bounds.width / 2);
        const mouseY = event.clientY - (bounds.top + bounds.height / 2);
        baseRotateY.set(mouseX * 0.02);
        baseRotateX.set(-mouseY * 0.02);
      }}
      onMouseLeave={() => {
        baseRotateX.set(0);
        baseRotateY.set(0);
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-[rgba(18,123,163,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-strong)]">{data.category}</span>
        {data.isToday ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#2F8F4F]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
            Today
          </span>
        ) : null}
      </div>

      <h3 className="mb-3 text-base font-semibold text-[var(--accent-dark)]">{data.event_name}</h3>

      <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {data.venue_name}
        </p>
        <p className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {formatDate(data.event_date)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className={`text-xs ${data.seats_left < 10 ? "text-[#F59E0B]" : "text-[#22C55E]"}`}>
          {data.seats_left} seats left
        </p>
        <button type="button" className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]" onClick={() => window.location.assign("/events") }>
          Book -&gt;
        </button>
      </div>
    </motion.article>
  );
}

const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

export default function HeroSection() {
  const router = useRouter();
  const [videoOpen, setVideoOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const card1Y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const card2Y = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const card3Y = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const preheadingRef = useRef<HTMLDivElement | null>(null);
  const subheadlineRef = useRef<HTMLParagraphElement | null>(null);
  const ctaBlockRef = useRef<HTMLDivElement | null>(null);
  const trustRowRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!headlineRef.current || !preheadingRef.current || !subheadlineRef.current || !ctaBlockRef.current || !trustRowRef.current) {
      return;
    }

    const split = new SplitText(headlineRef.current, { type: "chars" });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline
      .from(preheadingRef.current, {
        x: -26,
        opacity: 0,
        duration: 0.55,
      })
      .from(
        split.chars,
        {
          yPercent: 120,
          opacity: 0,
          rotateX: -60,
          transformOrigin: "50% 100%",
          stagger: 0.018,
          duration: 0.95,
        },
        0.12,
      );

    timeline.eventCallback("onComplete", () => {
      split.revert();
    });

    gsap.set([subheadlineRef.current, ctaBlockRef.current, trustRowRef.current], {
      opacity: 1,
      y: 0,
      filter: "none",
      clearProps: "transform,filter",
    });

    return () => {
      timeline.kill();
      split.revert();
    };
  }, []);

  useEffect(() => {
    if (!indicatorRef.current) {
      return;
    }

    const tween = gsap.to(indicatorRef.current, {
      y: 10,
      duration: 1.2,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    });

    return () => {
      tween.kill();
    };
  }, []);

  const buttonRawX = useMotionValue(0);
  const buttonRawY = useMotionValue(0);
  const buttonX = useSpring(buttonRawX, { stiffness: 260, damping: 22, mass: 0.45 });
  const buttonY = useSpring(buttonRawY, { stiffness: 260, damping: 22, mass: 0.45 });

  const cards = useMemo<FloatingEventCardProps[]>(
    () => [
      {
        data: {
          category: "Music",
          isToday: true,
          event_name: "AR Rahman Concert",
          venue_name: "Music Arena Bangalore",
          event_date: "2026-05-05",
          seats_left: 8,
        },
        top: 10,
        right: -10,
        rotate: -3,
        y: card1Y,
      },
      {
        data: {
          category: "Movie",
          event_name: "Avengers Movie Night",
          venue_name: "Grand Cinema Hall Chennai",
          event_date: "2026-04-10",
          seats_left: 22,
        },
        top: 130,
        right: 40,
        rotate: 2,
        y: card2Y,
      },
      {
        data: {
          category: "Festival",
          event_name: "Spring Festival",
          venue_name: "Convention Center Delhi",
          event_date: "2026-07-15",
          seats_left: 6,
        },
        top: 250,
        right: 90,
        rotate: -1,
        y: card3Y,
      },
    ],
    [card1Y, card2Y, card3Y],
  );

  return (
    <section className="relative min-h-[100svh] overflow-hidden pt-24 text-[var(--text-primary)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[100px] -top-[200px] h-[700px] w-[700px] animate-float rounded-full blur-[40px]"
        style={{
          background: "radial-gradient(circle, rgba(53,168,214,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[150px] -right-[100px] h-[500px] w-[500px] animate-float rounded-full blur-[40px]"
        style={{
          animationDuration: "10s",
          animationDirection: "reverse",
          background: "radial-gradient(circle, rgba(18,123,163,0.14) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[40%] top-[40%] h-[300px] w-[300px] animate-float rounded-full blur-[40px]"
        style={{
          animationDuration: "6s",
          animationDelay: "2s",
          background: "radial-gradient(circle, rgba(8,48,71,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(8,48,71,0.09) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto grid min-h-[calc(100svh-6rem)] max-w-[1400px] grid-cols-12 px-5 pb-20 sm:px-8">
        <div className="col-span-12 flex items-center py-12 lg:col-span-7 lg:py-0">
          <div className="space-y-7">
            <div ref={preheadingRef} className="flex items-center gap-3">
              <span className="h-[2px] w-6 rounded bg-[var(--accent)]" />
              <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--accent)]">THE FUTURE OF EVENT BOOKING</p>
            </div>

            <h1
              ref={headlineRef}
              className="font-display leading-[0.95] tracking-[-0.03em]"
            >
              <span className="block text-[clamp(56px,8vw,100px)] font-extrabold text-[var(--accent-dark)]">Every Great</span>
              <span
                data-hero-accent="true"
                className="block text-[clamp(64px,9vw,120px)] font-extrabold italic text-[var(--accent-light)]"
              >
                Moment
              </span>
              <span className="block text-[clamp(56px,8vw,100px)] font-extrabold text-[var(--accent-dark)]">Starts Here.</span>
            </h1>

            <p
              ref={subheadlineRef}
              className="max-w-[480px] text-[clamp(16px,2vw,20px)] font-normal leading-[1.6] text-[var(--text-secondary)]"
            >
              Book tickets for movies, concerts, sports and live events - instantly. No queues. No hassle.
            </p>

            <div ref={ctaBlockRef} className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <motion.div
                  style={{ x: buttonX, y: buttonY }}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const offsetX = event.clientX - (bounds.left + bounds.width / 2);
                    const offsetY = event.clientY - (bounds.top + bounds.height / 2);

                    buttonRawX.set(lerp(buttonRawX.get(), offsetX * 0.22, 0.3));
                    buttonRawY.set(lerp(buttonRawY.get(), offsetY * 0.22, 0.3));
                  }}
                  onMouseLeave={() => {
                    buttonRawX.set(0);
                    buttonRawY.set(0);
                  }}
                >
                  <Button
                    onClick={() => router.push("/events")}
                    className="relative h-[52px] overflow-hidden rounded-xl bg-[var(--accent)] px-8 text-base font-semibold text-white hover:bg-[var(--accent-strong)]"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.24),transparent)] bg-[length:200%_100%] animate-shimmer" />
                    <span className="relative">Start Booking</span>
                  </Button>
                </motion.div>

                <Button
                  variant="ghost"
                  onClick={() => setVideoOpen(true)}
                  className="h-[52px] rounded-xl border border-[rgba(8,48,71,0.18)] bg-[rgba(255,255,255,0.72)] px-6 text-base font-medium text-[var(--accent-dark)] hover:bg-[rgba(18,123,163,0.08)]"
                >
                  <Play className="h-4 w-4 animate-pulse text-[var(--accent)]" />
                  Watch Demo
                </Button>
              </div>

              <div ref={trustRowRef} className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-[var(--text-secondary)]">
                <span>✓ Free to register</span>
                <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                <span>✓ Instant confirmation</span>
                <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                <span>✓ Secure payments</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative col-span-12 hidden lg:col-span-5 lg:flex lg:items-center lg:justify-end">
          <div className="relative h-[610px] w-full max-w-[560px]">
            {cards.map((card) => (
              <FloatingEventCard
                key={`${card.data.event_name}-${card.top}`}
                data={card.data}
                top={card.top}
                right={card.right}
                rotate={card.rotate}
                y={card.y}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div ref={indicatorRef} className="flex flex-col items-center gap-1.5">
          <ChevronDown className="h-5 w-5 text-[var(--text-secondary)]" />
          <p className="font-mono text-xs text-[var(--text-secondary)]">Scroll to explore</p>
        </div>
      </div>

      <Modal isOpen={videoOpen} onClose={() => setVideoOpen(false)} title="Demo Preview">
        <div className="space-y-4 text-sm text-[var(--text-secondary)]">
          <p>Interactive demo is coming in a later prompt. Start exploring live events now.</p>
          <Button onClick={() => router.push("/events")} className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]">
            Go to Events
          </Button>
        </div>
      </Modal>
    </section>
  );
}
