"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ChevronRight, MapPin, Calendar, Users, Share2, Copy, Star, Phone } from "lucide-react";
import { z } from "zod";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useUserStore } from "@/lib/store/userStore";
import { formatDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewData {
  review_id: number;
  user_id: number;
  event_id: number;
  rating: number;
  comment: string;
  user?: { name: string };
}

interface EventData {
  event_id: number;
  event_name: string;
  event_date: string;
  venue?: { venue_name: string; location: string; capacity: number };
  category?: { category_name: string };
  organizer?: { name: string; contact: string };
  artists?: { artist_id: number; artist_name: string; genre: string }[];
  reviews: ReviewData[];
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(255),
});

// ─── Small helpers ────────────────────────────────────────────────────────────

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}
        />
      ))}
    </span>
  );
}

function SeatIndicator({ available, total }: { available: number; total: number }) {
  const pct = total > 0 ? available / total : 0;
  const { label, color, bar } =
    pct > 0.5
      ? { label: "Seats available", color: "text-green-600", bar: "bg-green-500" }
      : pct > 0.1
      ? { label: "Filling up", color: "text-amber-600", bar: "bg-amber-500" }
      : { label: available === 0 ? "Sold out" : "Almost sold out", color: "text-red-600", bar: "bg-red-500" };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-semibold", color)}>{label}</span>
        <span className="text-[var(--text-secondary)]">
          {available}/{total} left
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn("h-full rounded-full transition-all", bar)}
          style={{ width: `${Math.max(pct * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventDetailClient({ event }: { event: EventData }) {
  const router = useRouter();
  const { isAuthed, user } = useUserStore();

  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [starHover, setStarHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewErrors, setReviewErrors] = useState<{ rating?: string[]; comment?: string[] }>({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { event_id, event_name, event_date, venue, category, organizer, artists = [], reviews, availableSeats, totalSeats } = event;

  // Derived review stats
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // About copy
  const aboutFull = `${event_name} is a premier ${category?.category_name.toLowerCase() ?? "live"} event hosted at ${venue?.venue_name ?? "the venue"} in ${venue?.location ?? "the city"}. Organised by ${organizer?.name ?? "the organiser"}, this event promises an unforgettable experience for all attendees. Expect world-class performances, a vibrant atmosphere, and memories that will last a lifetime. Doors open 45 minutes before the show. Please carry a valid photo ID and your e-ticket for entry. Food and beverages will be available at the venue. Outside food and drinks are not permitted.`;
  const aboutShort = aboutFull.slice(0, 220) + "…";

  async function handleReviewSubmit() {
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setReviewErrors(parsed.error.flatten().fieldErrors as { rating?: string[]; comment?: string[] });
      return;
    }
    setReviewErrors({});
    setSubmitting(true);
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.user_id, event_id, ...parsed.data }),
      });
      setReviewModalOpen(false);
      setRating(0);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const bannerSeed = event_id * 37;
  const bannerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: bannerRef, offset: ["start start", "end start"] });
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const bannerScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  useEffect(() => {
    if (!contentRef.current) return;
    const els = contentRef.current.querySelectorAll(".reveal-item");
    gsap.fromTo(els,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.1, delay: 0.15 }
    );
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Breadcrumb */}
        <nav className="reveal-item mb-6 flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
          <button onClick={() => router.push("/events")} className="hover:text-[var(--accent-dark)] transition-colors">Events</button>
          <ChevronRight size={13} />
          <span>{category?.category_name}</span>
          <ChevronRight size={13} />
          <span className="truncate text-[var(--accent-dark)]">{event_name}</span>
        </nav>

        {/* Banner — Ken Burns parallax */}
        <div ref={bannerRef} className="reveal-item relative mb-8 aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-[0_24px_60px_rgba(8,48,71,0.14)]">
          <motion.div className="absolute inset-0" style={{ y: bannerY, scale: bannerScale }}>
            <Image
              src={`https://picsum.photos/seed/${bannerSeed}/1280/720`}
              alt={event_name}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              priority
            />
          </motion.div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Two-column layout */}
        <div ref={contentRef} className="flex flex-col gap-10 lg:flex-row">

          {/* ── LEFT COLUMN ── */}
          <div className="min-w-0 flex-1 space-y-10">

            {/* Title + meta */}
            <div className="reveal-item">
              <h1 className="font-display mb-4 text-3xl font-bold text-[var(--accent-dark)]">{event_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Badge variant="category">{category?.category_name}</Badge>
                {venue && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {venue.venue_name}, {venue.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {formatDate(event_date)}
                </span>
                {organizer && <span>By {organizer.name}</span>}
              </div>
            </div>

            {/* Artists */}
            {artists.length > 0 && (
              <section className="reveal-item">
                <h2 className="mb-4 text-base font-semibold text-[var(--accent-dark)]">Performing</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {artists.map((a) => (
                    <div
                      key={a.artist_id}
                      className="flex min-w-[140px] flex-col items-center gap-2 rounded-xl border border-[var(--border)] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                        {a.artist_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-center text-sm font-semibold text-[var(--accent-dark)]">{a.artist_name}</span>
                      <Badge variant="default" className="text-[10px]">{a.genre}</Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* About */}
            <section className="reveal-item">
              <h2 className="mb-3 text-base font-semibold text-[var(--accent-dark)]">About this Event</h2>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)]">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={showFullAbout ? "full" : "short"}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    {showFullAbout ? aboutFull : aboutShort}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                onClick={() => setShowFullAbout((v) => !v)}
                className="mt-2 text-sm font-medium text-[var(--accent-light)] hover:underline"
              >
                {showFullAbout ? "Show less" : "Show more"}
              </button>
            </section>

            {/* Venue */}
            {venue && (
              <section className="reveal-item">
                <h2 className="mb-3 text-base font-semibold text-[var(--accent-dark)]">Venue</h2>
                <div className="rounded-xl border border-[var(--border)] p-5">
                  <p className="mb-1 text-base font-semibold text-[var(--accent-dark)]">{venue.venue_name}</p>
                  <p className="mb-1 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <MapPin size={14} /> {venue.location}
                  </p>
                  <p className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <Users size={14} /> Capacity: {venue.capacity.toLocaleString("en-IN")} seats
                  </p>
                  <div className="flex h-36 items-center justify-center rounded-lg bg-zinc-100 text-sm text-[var(--text-muted)]">
                    Map unavailable
                  </div>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="reveal-item">
              <h2 className="mb-4 text-base font-semibold text-[var(--accent-dark)]">Reviews</h2>

              {reviews.length > 0 ? (
                <>
                  {/* Average + breakdown */}
                  <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-display text-5xl font-extrabold text-[var(--accent)]">
                        {avgRating.toFixed(1)}
                      </span>
                      <StarRow rating={avgRating} size={18} />
                      <span className="text-sm text-[var(--text-secondary)]">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      {ratingCounts.map(({ star, count }) => {
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                            <span className="w-4 text-right">{star}★</span>
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
                              <motion.div
                                className="h-full rounded-full bg-[var(--accent-light)]"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9, delay: (5 - star) * 0.08, ease: "easeOut" }}
                              />
                            </div>
                            <span className="w-8 text-right">{Math.round(pct)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review cards */}
                  <div className="space-y-3">
                    {visibleReviews.map((r, idx) => (
                      <motion.div
                        key={r.review_id}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ delay: idx * 0.07, type: "spring", stiffness: 320, damping: 26 }}
                        whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(18,123,163,0.1)", borderColor: "rgba(18,123,163,0.22)" }}
                        className="rounded-2xl border border-[var(--border)] p-4 transition-colors"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--accent-dark)]">{r.user?.name ?? "Anonymous"}</span>
                          <StarRow rating={r.rating} size={13} />
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{r.comment}</p>
                      </motion.div>
                    ))}
                  </div>

                  {reviews.length > 3 && (
                    <button
                      onClick={() => setShowAllReviews((v) => !v)}
                      className="mt-3 text-sm font-medium text-[var(--accent-light)] hover:underline"
                    >
                      {showAllReviews ? "Show less" : `Show all ${reviews.length} reviews`}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No reviews yet. Be the first to review!</p>
              )}

              {isAuthed && (
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={() => setReviewModalOpen(true)}>
                    Write a Review
                  </Button>
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <aside className="w-full lg:w-[360px] lg:shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 26 }}
              className="sticky top-24 rounded-2xl border border-[var(--border)] p-6"
            >
              <h3 className="mb-5 text-xl font-bold text-[var(--accent-dark)]">Book Tickets</h3>

              <SeatIndicator available={availableSeats} total={totalSeats} />

              <div className="my-5 space-y-2 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Calendar size={15} />
                  <span className="font-medium text-[var(--accent-dark)]">{formatDate(event_date)}</span>
                </div>
                {venue && (
                  <div className="flex items-center gap-2">
                    <MapPin size={15} />
                    <span>{venue.venue_name}</span>
                  </div>
                )}
                {organizer && (
                  <div className="flex items-center gap-2">
                    <Phone size={15} />
                    <span>{organizer.name} · {organizer.contact}</span>
                  </div>
                )}
              </div>

              <div className="mb-5 border-t border-[var(--border)] pt-5">
                <p className="text-lg font-semibold text-[var(--accent)]">Seats from ₹150</p>
                <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">Convenience fee: ₹29/ticket</p>
              </div>

              <motion.button
                disabled={availableSeats === 0}
                onClick={() => router.push(isAuthed ? `/booking/${event_id}` : "/auth/login")}
                whileHover={availableSeats > 0 ? {
                  scale: 1.03,
                  boxShadow: "0 0 0 6px rgba(18,123,163,0.18), 0 12px 30px rgba(18,123,163,0.3)",
                } : {}}
                whileTap={availableSeats > 0 ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-[var(--accent-strong)]"
              >
                {availableSeats === 0 ? "Sold Out" : "Select Seats →"}
              </motion.button>

              {/* Share row */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  className="neu-raised flex h-9 w-9 items-center justify-center rounded-full"
                  onClick={() => navigator.share?.({ title: event_name, url: window.location.href })}
                  aria-label="Share"
                >
                  <Share2 size={15} className="text-[var(--text-secondary)]" />
                </button>
                <button
                  className="neu-raised flex h-9 w-9 items-center justify-center rounded-full"
                  onClick={handleCopy}
                  aria-label="Copy link"
                >
                  <Copy size={15} className={copied ? "text-green-600" : "text-[var(--text-secondary)]"} />
                </button>
                {copied && <span className="text-xs text-green-600">Copied!</span>}
              </div>
            </motion.div>
          </aside>
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Write a Review">
        <div className="space-y-5">
          {/* Star selector */}
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--accent-dark)]">Your rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.button
                  key={s}
                  className="neu-raised flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                  onMouseEnter={() => setStarHover(s)}
                  onMouseLeave={() => setStarHover(0)}
                  onClick={() => setRating(s)}
                  whileHover={{ scale: 1.2, rotate: -8 }}
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: s <= rating ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
                >
                  <Star
                    size={18}
                    className={s <= (starHover || rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}
                  />
                </motion.button>
              ))}
            </div>
            {reviewErrors.rating && (
              <p className="mt-1 text-xs text-red-600">{reviewErrors.rating[0]}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--accent-dark)]">Your review</p>
            <textarea
              className="neu-pressed w-full resize-none rounded-xl p-3 text-sm text-[var(--accent-dark)] outline-none placeholder:text-[var(--text-muted)]"
              rows={4}
              maxLength={255}
              placeholder="Share your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-1 flex items-center justify-between">
              {reviewErrors.comment ? (
                <p className="text-xs text-red-600">{reviewErrors.comment[0]}</p>
              ) : <span />}
              <span className="text-xs text-[var(--text-muted)]">{comment.length}/255</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            loading={submitting}
            onClick={handleReviewSubmit}
          >
            Submit Review
          </Button>
        </div>
      </Modal>
    </div>
  );
}
