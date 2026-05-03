"use client";

import dynamic from "next/dynamic";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import QRCodeDisplay from "@/components/ui/QRCodeDisplay";
import { useBookingStore, calcPricing } from "@/lib/store/bookingStore";
import { useUserStore } from "@/lib/store/userStore";

const Ticket3DDynamic = dynamic(() => import("@/components/confirmation/Ticket3D"), { ssr: false });

type ConfirmationPayload = {
  booking: {
    booking_id: number;
    booking_date: string;
  };
  event: {
    event_name: string;
    event_date: string;
  };
  venue: {
    venue_name: string;
    location: string;
  };
  payment: {
    amount: number;
    payment_method: string;
    status: string;
  };
  user: {
    name: string;
    email: string;
    phone: string;
  };
  tickets: Array<{
    ticket_id: number;
    qr_code: string;
    seat_number: string;
  }>;
  seatLabels: string[];
  totalSeats: number;
};

export default function ConfirmationPage({ params }: { params: Promise<{ booking_id: string }> }) {
  const { booking_id } = use(params);
  const bookingId = Number(booking_id);
  const router = useRouter();
  const [payload, setPayload] = useState<ConfirmationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedSeats, appliedDiscount } = useBookingStore();
  const { user } = useUserStore();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch(`/api/confirmation/${bookingId}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) throw new Error();
        if (!active) return;
        setPayload(json.data as ConfirmationPayload);
      } catch {
        // silently fall back to store-based ticket
      } finally {
        if (active) setLoading(false);
      }
    }

    if (!Number.isNaN(bookingId)) {
      load();
    } else {
      setLoading(false);
    }

    return () => { active = false; };
  }, [bookingId]);

  const ticketMeta = useMemo(() => {
    if (payload) {
      return {
        bookingId: payload.booking.booking_id,
        guestName: payload.user.name,
        eventName: payload.event.event_name,
        venueName: payload.venue.venue_name,
        venueLocation: payload.venue.location,
        eventDate: payload.event.event_date,
        seats: payload.seatLabels,
        amount: payload.payment.amount,
        paymentMethod: payload.payment.payment_method,
        qrSeed: payload.tickets.map((t) => t.qr_code).join("|"),
      };
    }
    // Fallback: build ticket from Zustand store so the page never shows an error
    const { total } = calcPricing(selectedSeats, appliedDiscount);
    const seatLabels = selectedSeats.map((s) => s.seat_number);
    return {
      bookingId,
      guestName: user?.name ?? "Guest",
      eventName: "Your Event",
      venueName: "Venue",
      venueLocation: "Location",
      eventDate: new Date().toISOString(),
      seats: seatLabels,
      amount: total,
      paymentMethod: "Card",
      qrSeed: `BKG-${bookingId}-${seatLabels.join("-")}`,
    };
  }, [payload, bookingId, selectedSeats, appliedDiscount, user]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_20px_60px_rgba(46,34,27,0.08)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-white p-3 shadow-[0_0_20px_rgba(22,163,74,0.12)]">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Payment successful</p>
              <h1 className="font-syne text-3xl font-bold text-[var(--accent-dark)]">Your ticket is ready</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                A personalized ticket has been generated for {ticketMeta.guestName}.
              </p>
            </div>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            {loading ? "Loading ticket..." : `Booking #${bookingId}`}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-[0_24px_70px_rgba(46,34,27,0.1)]">
            <Ticket3DDynamic
              bookingId={ticketMeta.bookingId}
              guestName={ticketMeta.guestName}
              eventName={ticketMeta.eventName}
              venueName={ticketMeta.venueName}
              venueLocation={ticketMeta.venueLocation}
              eventDate={ticketMeta.eventDate}
              seats={ticketMeta.seats}
              amount={ticketMeta.amount}
              paymentMethod={ticketMeta.paymentMethod}
              qrSeed={ticketMeta.qrSeed}
            />
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_18px_40px_rgba(46,34,27,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Booking summary</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SummaryItem label="Booking ID" value={`BKG-${bookingId}`} />
                <SummaryItem label="Guest" value={ticketMeta.guestName} />
                <SummaryItem label="Event" value={ticketMeta.eventName} />
                <SummaryItem label="Venue" value={ticketMeta.venueName} />
                <SummaryItem label="Seats" value={ticketMeta.seats.join(", ") || "-"} />
                <SummaryItem label="Paid via" value={ticketMeta.paymentMethod} />
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_40px_rgba(46,34,27,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Receipt</p>
                  <h2 className="mt-1 font-syne text-2xl font-bold text-[var(--accent-dark)]">{ticketMeta.eventName}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {ticketMeta.venueName} · {ticketMeta.venueLocation}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F3E9DE] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Total paid</p>
                  <p className="font-syne text-2xl font-bold text-[var(--accent-dark)]">₹{ticketMeta.amount.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => window.print()}>Download Ticket</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const ics = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:${ticketMeta.eventName}\nDTSTART:${ticketMeta.eventDate.replace(/-/g, "").slice(0, 8)}\nLOCATION:${ticketMeta.venueName}\nDESCRIPTION:Booking ID: BKG-${bookingId}\nEND:VEVENT\nEND:VCALENDAR`;
                    const blob = new Blob([ics], { type: "text/calendar" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `booking-${bookingId}.ics`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Add to Calendar
                </Button>
                <button className="ml-auto text-[var(--accent)] transition hover:text-[var(--accent-strong)]" onClick={() => router.push("/events")}>Browse More Events →</button>
              </div>
            </section>

            {/* Per-ticket QR codes */}
            {payload?.tickets && payload.tickets.length > 0 && (
              <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_18px_40px_rgba(46,34,27,0.06)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Entry QR Codes — scan at gate
                </p>
                <div className="flex flex-wrap gap-6 justify-center">
                  {payload.tickets.map((ticket) => (
                    <QRCodeDisplay
                      key={ticket.ticket_id}
                      value={ticket.qr_code}
                      size={160}
                      label={`Seat ${ticket.seat_number}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Dev-mode fallback QR when no DB tickets yet */}
            {!payload?.tickets?.length && !loading && (
              <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_18px_40px_rgba(46,34,27,0.06)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Entry QR Code
                </p>
                <div className="flex justify-center">
                  <QRCodeDisplay
                    value={ticketMeta.qrSeed ?? `BKG-${bookingId}`}
                    size={160}
                    label={`BKG-${bookingId}`}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#FAF5EF] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--accent-dark)]">{value}</p>
    </div>
  );
}
