"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, QrCode, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/lib/store/userStore";

type BookingView = {
  booking_id: number;
  event_id: number;
  event_name: string;
  event_date: string;
  venue_name: string;
  location: string;
  seats: string[];
  amount: number;
  payment_method: string;
  payment_status: string;
  status: "Upcoming" | "Completed";
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function BookingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="mb-3 h-3 w-20 rounded-full shimmer" />
      <div className="mb-5 h-6 w-56 rounded-xl shimmer" />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl shimmer" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-28 rounded-lg shimmer" />
        <div className="h-9 w-32 rounded-lg shimmer" />
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(18,123,163,0.06)", scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className="rounded-xl border border-transparent bg-[rgba(255,255,255,0.68)] px-3 py-2.5 transition-colors"
    >
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#71717A]">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--accent-dark)]">{value}</p>
    </motion.div>
  );
}

const FILTER_TABS = ["All", "Upcoming", "Completed"] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, type: "spring" as const, stiffness: 320, damping: 26 },
  }),
  exit: { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.18 } },
};

export default function ProfileBookingsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Upcoming" | "Completed">("All");

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/profile/${user!.user_id}/bookings`, { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        const today = new Date();
        const data: BookingView[] = (json.data ?? []).map((b: BookingView) => ({
          ...b,
          status: new Date(b.event_date) >= today ? "Upcoming" : "Completed",
        }));
        setBookings(data);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  const counts = useMemo(() => ({
    All: bookings.length,
    Upcoming: bookings.filter((b) => b.status === "Upcoming").length,
    Completed: bookings.filter((b) => b.status === "Completed").length,
  }), [bookings]);

  const visible = useMemo(
    () => filter === "All" ? bookings : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_8px_32px_rgba(18,123,163,0.06)]"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--accent)]/8 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(18,123,163,0.1)] text-[var(--accent)]">
            <Ticket size={18} />
          </div>
          <div>
            <h1 className="font-syne text-3xl font-bold text-[var(--accent-dark)]">My Bookings</h1>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {loading ? "Loading…" : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
        </motion.div>
      </motion.header>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 26 }}
        className="flex flex-wrap items-center gap-2"
      >
        {FILTER_TABS.map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setFilter(tab)}
            className="relative rounded-full px-4 py-2 text-sm font-medium transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
          >
            {filter === tab && (
              <motion.span
                layoutId="booking-active-tab"
                className="absolute inset-0 rounded-full bg-[var(--accent)]"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <span className={`relative z-10 transition-colors ${filter === tab ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--accent-dark)]"}`}>
              {tab}
              {!loading && counts[tab] > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab ? "bg-white/25 text-white" : "bg-[rgba(18,123,163,0.12)] text-[var(--accent)]"}`}>
                  {counts[tab]}
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <BookingSkeleton />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-white py-16"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="mb-5 text-[var(--accent)] opacity-30"
          >
            <Ticket size={60} strokeWidth={1.2} />
          </motion.div>
          <h3 className="font-syne text-xl font-bold text-[var(--accent-dark)]">No bookings yet</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {filter === "All" ? "Find an event and book your first ticket." : `No ${filter.toLowerCase()} bookings.`}
          </p>
          <motion.button
            onClick={() => filter !== "All" ? setFilter("All") : router.push("/events")}
            whileHover={{ scale: 1.04, backgroundColor: "var(--accent-strong)" }}
            whileTap={{ scale: 0.96 }}
            className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {filter !== "All" ? "Show all bookings" : "Browse Events →"}
          </motion.button>
        </motion.div>
      )}

      {/* Booking cards */}
      {!loading && visible.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {visible.map((booking, i) => (
              <motion.article
                key={booking.booking_id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                whileHover={{
                  y: -5,
                  boxShadow: "0 28px 56px rgba(18,123,163,0.14)",
                  borderColor: "rgba(18,123,163,0.28)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.15 }}
                      className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]"
                    >
                      Booking #{booking.booking_id}
                    </motion.p>
                    <h2 className="mt-1 font-syne text-2xl font-bold text-[var(--accent-dark)]">
                      {booking.event_name}
                    </h2>
                  </div>

                  {/* Status badge */}
                  {booking.status === "Upcoming" ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.08 + 0.2, type: "spring", stiffness: 400 }}
                      className="relative rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      <motion.span
                        className="absolute inset-0 rounded-full bg-emerald-200"
                        animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.18, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                      />
                      <span className="relative">Upcoming</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.08 + 0.2, type: "spring", stiffness: 400 }}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600"
                    >
                      Completed
                    </motion.span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#3F3F46] md:grid-cols-2 xl:grid-cols-4">
                  <InfoItem icon={<Calendar size={14} />} label="Date" value={new Date(booking.event_date).toLocaleDateString("en-IN")} />
                  <InfoItem icon={<MapPin size={14} />} label="Venue" value={`${booking.venue_name}, ${booking.location}`} />
                  <InfoItem icon={<Ticket size={14} />} label="Seats" value={booking.seats.join(", ") || "—"} />
                  <InfoItem icon={<QrCode size={14} />} label="Paid" value={formatMoney(booking.amount)} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "var(--accent-strong)" }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors"
                    onClick={() => router.push(`/confirmation/${booking.booking_id}`)}
                  >
                    View Ticket
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(18,123,163,0.1)", borderColor: "rgba(18,123,163,0.35)" }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent-dark)] transition-colors"
                    onClick={() => router.push(`/events/${booking.event_id}`)}
                  >
                    Event Details
                  </motion.button>
                </div>
              </motion.article>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
