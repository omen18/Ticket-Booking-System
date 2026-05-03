"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Trash2, ChevronLeft, Tag, Mail, Phone, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useBookingStore, getSeatPrice, calcPricing, CONVENIENCE_FEE } from "@/lib/store/bookingStore";
import { useUserStore } from "@/lib/store/userStore";
import { useBookingFlow } from "@/lib/hooks/useBookingFlow";
import CountdownTimer from "@/components/ui/CountdownTimer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PaymentStep from "@/components/payment/PaymentStep";
import { formatDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import type { Seat, Discount } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventSummary {
  event_id: number;
  event_name: string;
  event_date: string;
  venue?: { venue_name: string; location: string };
  category?: { category_name: string };
}

// ─── Seat row prefix grouping ─────────────────────────────────────────────────

function groupByRow(seats: Seat[]): Record<string, Seat[]> {
  return seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const row = seat.seat_number[0].toUpperCase();
    (acc[row] ??= []).push(seat);
    return acc;
  }, {});
}

// ─── Price breakdown helper ───────────────────────────────────────────────────

function PriceBreakdown({
  seats,
  discount,
  compact = false,
}: {
  seats: Seat[];
  discount: Discount | null;
  compact?: boolean;
}) {
  const { subtotal, convFee, gst, discountAmt, total } = calcPricing(seats, discount);
  const row = (label: string, value: string, bold = false) => (
    <div className={cn("flex justify-between text-sm", bold ? "font-bold text-[var(--accent-dark)]" : "text-[var(--text-secondary)]")}>
      <span>{label}</span>
      <span>₹{value}</span>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {row("Subtotal", subtotal.toLocaleString("en-IN"))}
      {!compact && row(`Convenience fee (₹${CONVENIENCE_FEE} × ${seats.length})`, convFee.toLocaleString("en-IN"))}
      {!compact && row(`GST (18%)`, gst.toFixed(2))}
      {discount && discountAmt > 0 && (
        <div className="flex justify-between text-sm font-medium text-green-600">
          <span>{discount.code} ({discount.percentage}% off)</span>
          <span>−₹{discountAmt.toLocaleString("en-IN")}</span>
        </div>
      )}
      <div className="border-t border-[var(--border)] pt-1.5">
        {row("Total", total.toLocaleString("en-IN"), true)}
      </div>
    </div>
  );
}

// ─── Step 1: Seat Selection ───────────────────────────────────────────────────

function SeatStep({ event }: { event: EventSummary }) {
  const { selectedSeats, setSeats, appliedDiscount } = useBookingStore();
  const { nextStep } = useBookingFlow();

  const [seats, setAvailableSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [locking, setLocking] = useState(false);

  async function refreshSeats() {
    const json = await fetch(`/api/seats/${event.event_id}`).then((r) => r.json());
    setAvailableSeats(json.data ?? []);
  }

  useEffect(() => {
    refreshSeats().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.event_id]);

  // Poll seat availability every 8s so the map reflects other users' bookings
  useEffect(() => {
    const id = setInterval(refreshSeats, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.event_id]);

  function toggleSeat(seat: Seat) {
    const isSelected = selectedSeats.some((s) => s.seat_id === seat.seat_id);
    if (isSelected) {
      setSeats(selectedSeats.filter((s) => s.seat_id !== seat.seat_id));
    } else {
      if (selectedSeats.length >= 6) {
        toast.error("Maximum 6 seats per booking");
        return;
      }
      setSeats([...selectedSeats, { ...seat, status: "selected" }]);
    }
  }

  function handleExpire() {
    setExpired(true);
    // Best-effort release on the server too
    if (selectedSeats.length > 0) {
      const seatIds = selectedSeats.map((s) => s.seat_id);
      fetch("/api/seats/lock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.event_id, seat_ids: seatIds }),
        keepalive: true,
      }).catch(() => {});
    }
    setSeats([]);
  }

  function handleReselect() {
    setExpired(false);
    setTimerKey((k) => k + 1);
    refreshSeats();
  }

  async function handleContinue() {
    if (selectedSeats.length === 0) return;
    setLocking(true);
    try {
      const res = await fetch("/api/seats/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.event_id,
          seat_ids: selectedSeats.map((s) => s.seat_id),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to continue");
          window.location.href = `/auth/login?returnUrl=/booking/${event.event_id}`;
          return;
        }
        if (res.status === 409 && json.conflicts) {
          const conflictSet = new Set<number>(json.conflicts);
          const remaining = selectedSeats.filter((s) => !conflictSet.has(s.seat_id));
          setSeats(remaining);
          await refreshSeats();
          toast.error(
            `${json.conflicts.length} seat${json.conflicts.length > 1 ? "s" : ""} just became unavailable. Please reselect.`,
          );
          return;
        }
        toast.error(json.error ?? "Could not hold seats");
        return;
      }

      // Locks acquired — advance to review
      nextStep();
    } catch {
      toast.error("Network error");
    } finally {
      setLocking(false);
    }
  }

  const grouped = groupByRow(seats);
  const rows = Object.keys(grouped).sort();
  const allSeats = rows.flatMap((r) => grouped[r]);

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ── Seat map ── */}
        <div className="min-w-0 flex-1">
          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3"
          >
            <span className="text-sm text-[var(--text-secondary)]">Seats held for you:</span>
            <CountdownTimer key={timerKey} seconds={600} onExpire={handleExpire} />
          </motion.div>

          {/* Screen arc */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6 text-center">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Screen this side</p>
            <svg viewBox="0 0 320 24" className="mx-auto w-full max-w-sm" fill="none">
              <motion.path
                d="M10 20 Q160 2 310 20"
                stroke="#D1D9E6" strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
          </motion.div>

          {/* Seat availability counts */}
          {!loading && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  { label: "Available", count: seats.filter((s) => s.status === "available").length, cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                  { label: "Locked",    count: seats.filter((s) => s.status === "locked").length,    cls: "border-amber-200 bg-amber-50 text-amber-700" },
                  { label: "Booked",    count: seats.filter((s) => s.status === "booked").length,    cls: "border-red-200 bg-red-50 text-red-600" },
                ] as const
              ).map(({ label, count, cls }) => (
                <span key={label} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
                  <span className="tabular-nums">{count}</span> {label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                {seats.length} Total
              </span>
            </div>
          )}

          {/* Seat grid */}
          {loading ? (
            <div className="grid grid-cols-10 gap-1.5 pb-4">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div key={i} className="h-8 w-8 rounded-[6px] bg-[rgba(18,123,163,0.08)]"
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.02 }}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-auto seat-scroll touch-manipulation">
              <div className="inline-block min-w-full space-y-2 pb-4">
                {rows.map((row) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center text-[13px] font-semibold text-[var(--text-secondary)]">{row}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {grouped[row].map((seat) => {
                        const isSelected = selectedSeats.some((s) => s.seat_id === seat.seat_id);
                        const isBooked = seat.status === "booked";
                        const isLocked = seat.status === "locked";
                        const globalIdx = allSeats.findIndex((s) => s.seat_id === seat.seat_id);
                        return (
                          <SeatButton
                            key={seat.seat_id}
                            seat={seat}
                            isSelected={isSelected}
                            isBooked={isBooked}
                            isLocked={isLocked}
                            index={globalIdx}
                            onToggle={() => !isBooked && !isLocked && toggleSeat(seat)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Legend</span>
            {[
              { label: "Available",  dot: "bg-emerald-100 text-emerald-700",          icon: null },
              { label: "Selected",   dot: "bg-[var(--accent)] text-white",             icon: <Check size={9} /> },
              { label: "Locked",     dot: "bg-amber-100 text-amber-500",               icon: <Lock size={9} /> },
              { label: "Booked",     dot: "bg-red-100 text-red-400",                   icon: <X size={9} /> },
            ].map(({ label, dot, icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-[4px] font-semibold", dot)}>
                  {icon ?? <span className="text-[8px]">1</span>}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Booking summary panel ── */}
        <aside className="w-full lg:w-[320px] lg:shrink-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 28 }}
            className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-[0_16px_40px_rgba(8,48,71,0.08)]"
          >
            <p className="mb-0.5 text-base font-semibold text-[var(--accent-dark)]">{event.event_name}</p>
            <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
              {event.venue?.venue_name} · {formatDate(event.event_date)}
            </p>

            <AnimatePresence mode="popLayout">
              {selectedSeats.length === 0 ? (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mb-4 text-sm text-[var(--text-muted)]"
                >
                  No seats selected yet.
                </motion.p>
              ) : (
                <motion.div key="seats" className="mb-4 space-y-1.5">
                  {selectedSeats.map((s) => (
                    <motion.div key={s.seat_id}
                      initial={{ opacity: 0, x: -12, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-[var(--accent-dark)]">Seat {s.seat_number}</span>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span>₹{getSeatPrice(s.seat_number).toLocaleString("en-IN")}</span>
                        <motion.button
                          whileHover={{ scale: 1.2, color: "#dc2626" }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => setSeats(selectedSeats.filter((x) => x.seat_id !== s.seat_id))}
                          className="text-[var(--text-muted)]"
                        >
                          <Trash2 size={13} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedSeats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mb-5 border-t border-[var(--border)] pt-4 overflow-hidden"
              >
                <PriceBreakdown seats={selectedSeats} discount={appliedDiscount} />
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="primary" size="lg" className="w-full"
                disabled={selectedSeats.length === 0 || locking}
                onClick={handleContinue}
              >
                {locking ? "Holding seats..." : "Continue to Review"}
              </Button>
            </motion.div>
          </motion.div>
        </aside>
      </div>

      {/* Expired modal */}
      <Modal isOpen={expired} onClose={() => {}} title="Session Expired">
        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          Your seat hold has expired. Please reselect your seats.
        </p>
        <Button variant="primary" size="md" className="w-full" onClick={handleReselect}>
          Reselect Seats
        </Button>
      </Modal>
    </>
  );
}

// ─── Seat button with GSAP-style spring via Framer ───────────────────────────

function SeatButton({
  seat, isSelected, isBooked, isLocked, index, onToggle,
}: {
  seat: Seat; isSelected: boolean; isBooked: boolean; isLocked: boolean; index: number; onToggle: () => void;
}) {
  return (
    <motion.button
      title={
        isBooked ? `Seat ${seat.seat_number} — booked` :
        isLocked ? `Seat ${seat.seat_number} — held by another user` :
        `Seat ${seat.seat_number}`
      }
      onClick={onToggle}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22, delay: index * 0.008 }}
      whileHover={!isBooked && !isLocked ? { scale: 1.18, zIndex: 10 } : {}}
      whileTap={!isBooked && !isLocked ? { scale: 0.88 } : {}}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-[6px] text-[10px] font-semibold transition-colors",
        isBooked
          ? "cursor-not-allowed bg-red-100 text-red-400"
          : isLocked
          ? "cursor-not-allowed bg-amber-100 text-amber-500"
          : isSelected
          ? "bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(18,123,163,0.45)]"
          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
      )}
    >
      <AnimatePresence mode="wait">
        {isBooked ? (
          <motion.span key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <X size={10} />
          </motion.span>
        ) : isLocked ? (
          <motion.span key="lock" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Lock size={10} />
          </motion.span>
        ) : isSelected ? (
          <motion.span key="check"
            initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
          >
            <Check size={10} />
          </motion.span>
        ) : (
          <motion.span key="num" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {seat.seat_number.replace(/^[A-Za-z]/, "")}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Step 2: Review Order ─────────────────────────────────────────────────────

function ReviewStep({ event }: { event: EventSummary }) {
  const { user } = useUserStore();
  const { selectedSeats, appliedDiscount, applyDiscount } = useBookingStore();
  const { nextStep, prevStep } = useBookingFlow();

  const [code, setCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [applying, setApplying] = useState(false);

  async function handleApplyDiscount() {
    if (!code.trim()) return;
    setApplying(true);
    setDiscountError("");
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDiscountError(json.error ?? "Invalid or expired code");
        applyDiscount(null);
      } else {
        applyDiscount(json.data);
        toast.success(`${json.data.code} applied — ${json.data.percentage}% off!`);
      }
    } finally {
      setApplying(false);
    }
  }

  const { subtotal, convFee, gst, discountAmt, total } = calcPricing(selectedSeats, appliedDiscount);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Order table */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[rgba(18,123,163,0.08)]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[var(--accent-dark)]">Seat</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--accent-dark)]">Category</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--accent-dark)]">Price</th>
            </tr>
          </thead>
          <tbody>
            {selectedSeats.map((s) => (
              <tr key={s.seat_id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-[var(--accent-dark)]">Seat {s.seat_number}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{event.category?.category_name}</td>
                <td className="px-4 py-3 text-right text-[var(--accent-dark)]">
                  ₹{getSeatPrice(s.seat_number).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-[var(--border)] bg-[rgba(18,123,163,0.08)]">
            <tr>
              <td colSpan={2} className="px-4 py-2 text-[var(--text-secondary)]">Subtotal</td>
              <td className="px-4 py-2 text-right text-[var(--accent-dark)]">₹{subtotal.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2 text-[var(--text-secondary)]">
                Convenience fee (₹{CONVENIENCE_FEE} × {selectedSeats.length})
              </td>
              <td className="px-4 py-2 text-right text-[var(--accent-dark)]">₹{convFee.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2 text-[var(--text-secondary)]">GST (18%)</td>
              <td className="px-4 py-2 text-right text-[var(--accent-dark)]">₹{gst.toFixed(2)}</td>
            </tr>
            {appliedDiscount && discountAmt > 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-2 font-medium text-green-600">
                  {appliedDiscount.code} ({appliedDiscount.percentage}% off)
                </td>
                <td className="px-4 py-2 text-right font-medium text-green-600">
                  −₹{discountAmt.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
            <tr className="border-t border-[var(--border)]">
              <td colSpan={2} className="px-4 py-3 text-base font-bold text-[var(--accent-dark)]">Total</td>
              <td className="px-4 py-3 text-right text-base font-bold text-[var(--accent-dark)]">
                ₹{total.toLocaleString("en-IN")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Discount code */}
      <div className="rounded-2xl border border-[var(--border)] p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--accent-dark)]">Have a promo code?</p>
        {appliedDiscount ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
            <Check size={15} />
            {appliedDiscount.code} applied — {appliedDiscount.percentage}% off ✓
            <button
              className="ml-auto text-green-500 hover:text-green-700"
              onClick={() => { applyDiscount(null); setCode(""); }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setDiscountError(""); }}
              leadingIcon={<Tag size={14} />}
              error={discountError}
              className="uppercase"
            />
            <Button
              variant="primary"
              size="md"
              loading={applying}
              onClick={handleApplyDiscount}
              className="shrink-0"
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Contact details */}
      <div className="rounded-2xl border border-[var(--border)] p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--accent-dark)]">Ticket details will be sent to:</p>
        <div className="space-y-3">
          <Input
            label="Email"
            value={user?.email ?? ""}
            readOnly
            disabled
            leadingIcon={<Mail size={14} />}
          />
          <Input
            label="Phone"
            value={user?.phone ?? ""}
            readOnly
            disabled
            leadingIcon={<Phone size={14} />}
          />
        </div>
        <a href="/profile/settings" className="mt-2 inline-block text-xs text-[var(--accent-light)] hover:underline">
          Update in settings
        </a>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="primary" size="lg" className="w-full" onClick={nextStep}>
          Proceed to Payment
        </Button>
        <button
          onClick={prevStep}
          className="flex items-center justify-center gap-1 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-dark)]"
        >
          <ChevronLeft size={15} /> Back to Seat Selection
        </button>
      </div>
    </div>
  );
}

// ─── Main booking client ──────────────────────────────────────────────────────

const STEP_LABELS = ["Seats", "Review", "Payment"];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, filter: "blur(4px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, filter: "blur(4px)" }),
};

export default function BookingClient({ event }: { event: EventSummary }) {
  const { currentStep } = useBookingFlow();
  const router = useRouter();
  const prevStepRef = useRef(currentStep);
  const dir = currentStep > prevStepRef.current ? 1 : -1;

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--accent)] mb-2">BOOKING</p>
        <h1 className="font-display mb-6 text-2xl font-bold text-[var(--accent-dark)]">{event.event_name}</h1>

        {/* Animated step bar */}
        <div className="flex items-center gap-0">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const done = stepNum < currentStep;
            const active = stepNum === currentStep;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      done ? "bg-[var(--accent)] text-white" :
                      active ? "bg-[var(--accent-dark)] text-white shadow-[0_0_0_4px_rgba(182,91,58,0.2)]" :
                      "neu-raised text-[var(--text-muted)]"
                    )}
                    animate={{ scale: active ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {done ? <Check size={13} /> : stepNum}
                  </motion.div>
                  <span className={cn("text-[11px] font-medium",
                    active ? "text-[var(--accent-dark)]" : done ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                  )}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="relative mx-2 mb-4 h-[2px] w-12 bg-[var(--border)] overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-[var(--accent)]"
                      animate={{ width: done ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={currentStep}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {currentStep === 1 && <SeatStep event={event} />}
          {currentStep === 2 && <ReviewStep event={event} />}
          {currentStep === 3 && (
            <PaymentStep
              eventId={event.event_id}
              onSuccess={(bookingId) => router.push(`/confirmation/${bookingId}`)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
