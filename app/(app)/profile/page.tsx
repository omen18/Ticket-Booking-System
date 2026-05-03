"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CreditCard, MessageSquareText, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useUserStore } from "@/lib/store/userStore";

gsap.registerPlugin(ScrollTrigger);

type BookingItem = {
  booking_id: number; event_id: number; event_name: string; event_date: string;
  venue_name: string; location: string; seats: string[]; amount: number; payment_status: string;
};
type ReviewItem = {
  review_id: number; user_id: number; event_id: number; rating: number; comment: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

// Animated counter card using GSAP
function MetricCard({ label, numericValue, displayValue, icon, delay = 0 }: {
  label: string; numericValue: number; displayValue: string; icon: React.ReactNode; delay?: number;
}) {
  const valRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = valRef.current;
    const card = cardRef.current;
    if (!el || !card || numericValue === 0) return;

    const state = { val: 0 };
    ScrollTrigger.create({
      trigger: card,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(state, {
          val: numericValue,
          duration: 1.4,
          ease: "power2.out",
          delay,
          onUpdate: () => {
            el.textContent = numericValue % 1 !== 0
              ? state.val.toFixed(1)
              : Math.round(state.val).toLocaleString("en-IN");
          },
          onComplete: () => { el.textContent = displayValue; },
        });
      },
    });
  }, [numericValue, displayValue, delay]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(46,34,27,0.12)" }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow"
    >
      <motion.div
        className="mb-3 inline-flex rounded-xl bg-[#FDF0E8] p-2.5 text-[var(--accent)]"
        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p ref={valRef} className="mt-1 font-syne text-2xl font-bold text-[var(--accent-dark)]">
        {numericValue === 0 ? displayValue : "0"}
      </p>
    </motion.div>
  );
}

function ActionButton({ title, subtitle, icon, onClick, delay = 0 }: {
  title: string; subtitle: string; icon: React.ReactNode; onClick: () => void; delay?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: "spring", stiffness: 350, damping: 26 }}
      whileHover={{ x: 4, backgroundColor: "#FDF5EE", borderColor: "rgba(182,91,58,0.35)" }}
      className="flex w-full items-start gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-left transition-colors"
    >
      <motion.span
        className="mt-0.5 inline-flex rounded-lg bg-[#FDF0E8] p-2 text-[var(--accent)]"
        whileHover={{ scale: 1.15, rotate: -5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {icon}
      </motion.span>
      <span>
        <span className="block text-sm font-semibold text-[var(--accent-dark)]">{title}</span>
        <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{subtitle}</span>
      </span>
    </motion.button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const headerRef = useRef<HTMLElement>(null);

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(headerRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        const [bRes, rRes] = await Promise.all([
          fetch(`/api/profile/${user!.user_id}/bookings`, { cache: "no-store" }),
          fetch("/api/review", { cache: "no-store" }),
        ]);
        const [bJson, rJson] = await Promise.all([bRes.json(), rRes.json()]);
        if (!active) return;
        setBookings(bJson.data ?? []);
        setReviews((rJson.data ?? []).filter((r: ReviewItem) => r.user_id === user!.user_id));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  const metrics = useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter((b) => new Date(b.event_date) >= now).length;
    const totalSpend = bookings.reduce((sum, b) => sum + Number(b.amount), 0);
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    return { attended: bookings.length, upcoming, spend: totalSpend, avgRating, recentReviews: reviews.slice(0, 3) };
  }, [bookings, reviews]);

  if (!user) return null;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <header ref={headerRef} className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[0_8px_32px_rgba(46,34,27,0.06)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent)]/8 blur-3xl" />
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--accent)]">WELCOME BACK</p>
        <h1 className="mt-2 font-syne text-4xl font-extrabold text-[var(--accent-dark)]">{user.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{user.email}</p>
      </header>

      {/* Metric cards */}
      {!loading && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Events Booked" numericValue={metrics.attended} displayValue={String(metrics.attended)} icon={<Calendar size={18} />} delay={0} />
          <MetricCard label="Upcoming" numericValue={metrics.upcoming} displayValue={String(metrics.upcoming)} icon={<CreditCard size={18} />} delay={0.08} />
          <MetricCard label="Total Spend" numericValue={metrics.spend} displayValue={formatMoney(metrics.spend)} icon={<CreditCard size={18} />} delay={0.16} />
          <MetricCard label="Avg Rating" numericValue={metrics.avgRating} displayValue={`${metrics.avgRating.toFixed(1)}/5`} icon={<Star size={18} />} delay={0.24} />
        </section>
      )}
      {loading && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0,1,2,3].map((i) => (
            <motion.div key={i} className="h-28 rounded-2xl border border-[var(--border)] bg-white"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Recent Reviews</h2>
            <motion.button whileHover={{ x: 2 }} className="text-sm font-medium text-[var(--accent)] hover:underline" onClick={() => router.push("/profile/reviews")}>
              View all →
            </motion.button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0,1].map((i) => (
                <motion.div key={i} className="h-16 rounded-xl bg-[#f8f4ee]"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          ) : metrics.recentReviews.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No reviews yet. Share feedback after attending an event.</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentReviews.map((review, i) => {
                const booking = bookings.find((b) => b.event_id === review.event_id);
                return (
                  <motion.div key={review.review_id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--accent-dark)]">{booking?.event_name ?? "Event"}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={11} className={s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-[#3F3F46]">{review.comment}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-5"
        >
          <h2 className="mb-4 font-syne text-xl font-bold text-[var(--accent-dark)]">Quick Actions</h2>
          <div className="space-y-3">
            <ActionButton title="My Bookings" subtitle="View upcoming and past tickets" icon={<CreditCard size={16} />} onClick={() => router.push("/profile/bookings")} delay={0.4} />
            <ActionButton title="Write a Review" subtitle="Share your recent event experience" icon={<MessageSquareText size={16} />} onClick={() => router.push("/profile/reviews")} delay={0.46} />
            <ActionButton title="Update Settings" subtitle="Change your profile details" icon={<Calendar size={16} />} onClick={() => router.push("/profile/settings")} delay={0.52} />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
