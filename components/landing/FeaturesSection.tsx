"use client";

import { motion } from "framer-motion";
import { ArrowRight, CreditCard, Shield, Star, Tag, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Ticket,
    title: "Instant Seat Selection",
    description:
      "Pick your exact seat from a live interactive map. See availability in real time - every seat status pulled live from the database.",
  },
  {
    icon: Shield,
    title: "Double-Booking Protection",
    description:
      "Our UNIQUE(seat_id, event_id) constraint and concurrency control ensures no two users ever book the same seat.",
  },
  {
    icon: CreditCard,
    title: "Card & Net Banking Payments",
    description:
      "Secure OTP-verified payment flow supporting Credit/Debit cards and all major Indian banks. Every transaction recorded and traceable.",
  },
  {
    icon: Tag,
    title: "Smart Discount Codes",
    description:
      "Apply promo codes at checkout - auto-validated against expiry date and stored in Booking_Discount for full traceability.",
  },
  {
    icon: Star,
    title: "Rate & Review Events",
    description:
      "Post-event reviews with 1-5 star ratings, enforced by database CHECK constraints. Real feedback, reliably stored.",
  },
];

export default function FeaturesSection() {
  const router = useRouter();

  return (
    <section id="features" className="relative bg-[var(--bg-secondary)] px-5 py-24 text-[var(--text-primary)] sm:px-8">
      <svg
        className="absolute -top-[79px] left-0 h-20 w-full"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0,80 C360,0 1080,80 1440,0 L1440,80 Z" fill="#F4FBFF" />
      </svg>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-10">
        <aside className="col-span-12 lg:col-span-5">
          <div className="lg:sticky lg:top-[100px]">
            <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--accent)]">WHY BOOKING_SYSTEM</p>

            <h2 className="mt-4 max-w-[540px] font-display text-[clamp(42px,4.6vw,52px)] font-bold leading-[1.05] text-[var(--accent-dark)]">
              Built for people
              <br />
              who love live
              <br />
              experiences.
            </h2>

            <p className="mt-5 max-w-[340px] text-[17px] leading-[1.7] text-[var(--text-secondary)]">
              From movie premieres to music festivals - manage everything in one place.
            </p>

            <motion.button
              type="button"
              onClick={() => router.push("/events")}
              className="group mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--accent)]"
              whileHover="hovered"
            >
              <span>Explore All Events</span>
              <motion.span
                variants={{
                  hovered: { x: 6 },
                  initial: { x: 0 },
                }}
                initial="initial"
                transition={{ duration: 0.2 }}
                className="inline-flex"
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </motion.button>
          </div>
        </aside>

        <div className="col-span-12 space-y-6 lg:col-span-7">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] p-8 transition-[box-shadow] duration-[250ms] hover:shadow-[8px_8px_20px_#c8dfea,-8px_-8px_20px_#ffffff]"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(18,123,163,0.1)] text-[var(--accent)]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-[var(--accent-dark)]">{feature.title}</h3>
                    <p className="mt-3 text-[15px] leading-[1.7] text-[var(--text-secondary)]">{feature.description}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
