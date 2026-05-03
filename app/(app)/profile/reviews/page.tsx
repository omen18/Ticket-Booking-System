"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageSquare, Send, Star } from "lucide-react";
import toast from "react-hot-toast";

import { useUserStore } from "@/lib/store/userStore";

type ReviewItem = {
  review_id: number;
  user_id: number;
  event_id: number;
  rating: number;
  comment: string;
};

type EventItem = {
  event_id: number;
  event_name: string;
  event_date: string;
};

export default function ProfileReviewsPage() {
  const user = useUserStore((s) => s.user);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [eventId, setEventId] = useState<number | "">("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [reviewsRes, eventsRes] = await Promise.all([
          fetch("/api/review", { cache: "no-store" }),
          fetch("/api/events", { cache: "no-store" }),
        ]);

        const [reviewsJson, eventsJson] = await Promise.all([reviewsRes.json(), eventsRes.json()]);
        if (!active) return;
        const allReviews = reviewsJson.data ?? [];
        setReviews(allReviews.filter((r: ReviewItem) => r.user_id === user?.user_id));
        setEvents(eventsJson.data ?? []);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const myReviews = useMemo(() => reviews.filter((review) => review.user_id === user?.user_id), [reviews, user?.user_id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    if (!eventId) {
      toast.error("Please select an event");
      return;
    }

    if (comment.trim().length < 8) {
      toast.error("Comment must be at least 8 characters");
      return;
    }

    setPosting(true);
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          event_id: Number(eventId),
          rating,
          comment: comment.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        toast.error("Could not submit review");
        return;
      }

      setReviews((prev) => [json.data, ...prev]);
      setEventId("");
      setRating(5);
      setComment("");
      toast.success("Review submitted");
    } catch {
      toast.error("Network error while submitting review");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h1 className="font-syne text-3xl font-bold text-[var(--accent-dark)]">My Reviews</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Rate past experiences and help others discover great events.</p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-4 font-syne text-xl font-bold text-[var(--accent-dark)]">Write a Review</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Event</label>
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--accent-dark)] focus:border-[var(--accent)] focus:outline-none"
              value={eventId}
              onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select an event</option>
              {events.map((item) => (
                <option key={item.event_id} value={item.event_id}>
                  {item.event_name} - {new Date(item.event_date).toLocaleDateString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="rounded-md p-1"
                  aria-label={`Set rating to ${star}`}
                >
                  <Star size={20} className={star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"} />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-[#3F3F46]">{rating}/5</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={255}
              placeholder="Share your experience in a few lines..."
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--accent-dark)] focus:border-[var(--accent)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[#71717A]">{comment.length}/255</p>
          </div>

          <button
            type="submit"
            disabled={posting}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send size={15} />
            {posting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Your Review History</h2>
          <p className="text-sm text-[var(--text-secondary)]">{myReviews.length} total</p>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading reviews...</p>
        ) : myReviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D4D4D8] p-8 text-center">
            <MessageSquare className="mx-auto h-7 w-7 text-[#A1A1AA]" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No reviews yet. Write your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myReviews.map((review) => {
              const event = events.find((item) => item.event_id === review.event_id);
              return (
                <article key={review.review_id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--accent-dark)]">{event?.event_name ?? "Event"}</p>
                      <p className="mt-1 text-xs text-[#71717A]">
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString("en-IN") : "Date unavailable"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-amber-500">{review.rating}/5</p>
                  </div>
                  <p className="mt-3 text-sm text-[#3F3F46]">{review.comment}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
