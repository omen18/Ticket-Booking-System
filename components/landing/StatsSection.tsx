"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
  large?: boolean;
  starColor?: string;
  mono?: boolean;
}

const stats: StatItem[] = [
  { value: 50000, suffix: "+", label: "Events Booked", prefix: "", large: true },
  { value: 200, suffix: "+", label: "Venues Nationwide" },
  { value: 4.9, suffix: "★", label: "Average Rating", starColor: "#127ba3" },
  { value: 30, suffix: "sec", label: "Avg Booking Time", prefix: "<", mono: true },
];

const marqueeText =
  "GRAND CINEMA HALL • MUSIC ARENA • CITY THEATRE • AR RAHMAN CONCERT • SPRING FESTIVAL • AVENGERS NIGHT •";

function formatValue(value: number, item: StatItem) {
  if (item.value % 1 !== 0) {
    return value.toFixed(1);
  }

  return Math.round(value).toLocaleString("en-IN");
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const lineRef = useRef<SVGLineElement | null>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const line = lineRef.current;

    if (!section) {
      return;
    }

    const triggers: ScrollTrigger[] = [];

    stats.forEach((item, index) => {
      const element = counterRefs.current[index];

      if (!element) {
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => {
          const state = { value: 0 };

          gsap.to(state, {
            value: item.value,
            duration: 2,
            ease: "power2.out",
            snap: { value: item.value % 1 !== 0 ? 0.1 : 1 },
            onUpdate: () => {
              const formatted = formatValue(state.value, item);
              element.innerText = `${item.prefix ?? ""}${formatted}${item.suffix}`;
            },
          });
        },
      });

      triggers.push(trigger);
    });

    if (line) {
      const totalLength = line.getTotalLength();
      line.style.strokeDasharray = `${totalLength}`;
      line.style.strokeDashoffset = `${totalLength}`;

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to(line, {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: "power2.out",
          });
        },
      });

      triggers.push(trigger);
    }

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  const initialValues = useMemo(
    () =>
      stats.map((item) => `${item.prefix ?? ""}${item.value % 1 !== 0 ? "0.0" : "0"}${item.suffix}`),
    [],
  );

  return (
    <section
      ref={sectionRef}
      className="relative -mt-10 overflow-hidden bg-[#d8edf7] px-5 pb-10 pt-16 sm:px-8"
      style={{ clipPath: "polygon(0 40px, 100% 0, 100% 100%, 0 100%)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative">
          <svg className="pointer-events-none absolute left-0 top-1/2 hidden h-[2px] w-full -translate-y-1/2 lg:block" viewBox="0 0 1200 2" preserveAspectRatio="none">
            <line ref={lineRef} x1="0" y1="1" x2="1200" y2="1" stroke="rgba(18,123,163,0.24)" strokeWidth="1" />
          </svg>

          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
          >
            {stats.map((item, index) => (
              <article
                key={`${item.label}-${index}`}
                className={`relative py-3 ${index !== stats.length - 1 ? "lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:h-14 lg:after:w-px lg:after:-translate-y-1/2 lg:after:bg-[rgba(8,48,71,0.12)]" : ""}`}
              >
                <p className={`${item.large ? "text-5xl" : "text-4xl"} ${item.mono ? "font-mono" : "font-display"} font-extrabold leading-none text-[var(--accent-dark)]`}>
                  <span
                    ref={(element) => {
                      counterRefs.current[index] = element;
                    }}
                    className={item.starColor ? "text-[color:var(--star-color)]" : ""}
                    style={item.starColor ? ({ "--star-color": item.starColor } as CSSProperties) : undefined}
                  >
                    {initialValues[index]}
                  </span>
                </p>
                <p className="mt-2 text-[13px] font-normal text-[var(--text-secondary)]">{item.label}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-2 overflow-hidden border-t border-[rgba(8,48,71,0.1)] pt-4">
          {[0, 1].map((row) => (
            <div key={`marquee-${row}`} className="flex min-w-max animate-marquee gap-10 whitespace-nowrap font-mono text-[11px] tracking-[0.12em] text-[var(--text-muted)]">
              <span>{marqueeText}</span>
              <span>{marqueeText}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
