"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, QrCode, Search } from "lucide-react";

type ScanResult = {
  valid: boolean;
  reason?: string;
  ticket?: {
    ticket_id: number;
    booking_id?: number;
    seat_number: string;
    event_name: string;
    event_date?: string;
    venue_name?: string;
    user_name: string;
    user_email?: string;
    payment_status?: string;
  };
  checked_in?: boolean;
  checked_in_at?: string | null;
  already_used?: boolean;
};

export default function ScannerPage() {
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  async function inspect() {
    if (!qr.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/validate-ticket?qr=${encodeURIComponent(qr.trim())}`);
      const json = await res.json();
      setStatusCode(res.status);
      setResult(json.data ?? { valid: false, reason: json.error });
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    if (!qr.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/validate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: qr.trim() }),
      });
      const json = await res.json();
      setStatusCode(res.status);
      setResult(json.data ?? { valid: false, reason: json.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Entry Gate
        </p>
        <h1 className="mt-2 font-syne text-3xl font-bold text-[var(--accent-dark)]">
          Ticket Scanner
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Paste a QR code or scan one with a barcode reader at the venue gate.
          Inspect first to see ticket details, then check in.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          QR Code
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <QrCode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="Paste QR code (e.g. BKG-123-S5-...)"
              className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--accent-dark)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              autoFocus
            />
          </div>
          <button
            onClick={inspect}
            disabled={busy || !qr.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-dark)] hover:bg-[rgba(18,123,163,0.08)] disabled:opacity-50"
          >
            <Search size={14} />
            Inspect
          </button>
          <button
            onClick={checkIn}
            disabled={busy || !qr.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            Check In
          </button>
        </div>
      </section>

      {result && <ResultCard result={result} statusCode={statusCode ?? 200} />}
    </div>
  );
}

function ResultCard({ result, statusCode }: { result: ScanResult; statusCode: number }) {
  const isOk = result.valid && (result.checked_in || statusCode === 200);
  const isAlreadyUsed = !result.valid && statusCode === 409;
  const isInvalid = !result.valid && !isAlreadyUsed;

  if (isInvalid) {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <XCircle size={28} className="text-red-600" />
          <div>
            <p className="font-syne text-xl font-bold text-red-900">Invalid Ticket</p>
            <p className="text-sm text-red-700">{result.reason ?? "Ticket not recognised"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAlreadyUsed) {
    return (
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle size={28} className="text-amber-600" />
          <div>
            <p className="font-syne text-xl font-bold text-amber-900">Already Checked In</p>
            <p className="text-sm text-amber-800">
              {result.checked_in_at && (
                <>at {new Date(result.checked_in_at).toLocaleString("en-IN")} </>
              )}
            </p>
          </div>
        </div>
        {result.ticket && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Field label="Holder" value={result.ticket.user_name} />
            <Field label="Seat" value={result.ticket.seat_number} />
            <Field label="Event" value={result.ticket.event_name} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 p-6 ${
      isOk ? "border-emerald-200 bg-emerald-50" : "border-[var(--border)] bg-white"
    }`}>
      <div className="flex items-center gap-3">
        {isOk ? (
          <CheckCircle2 size={28} className="text-emerald-600" />
        ) : (
          <Search size={28} className="text-[var(--accent)]" />
        )}
        <div>
          <p className={`font-syne text-xl font-bold ${
            isOk ? "text-emerald-900" : "text-[var(--accent-dark)]"
          }`}>
            {isOk ? "Checked In ✓" : "Valid Ticket — Ready to Check In"}
          </p>
          {result.ticket && (
            <p className="text-sm text-[var(--text-secondary)]">
              Booking #{result.ticket.booking_id ?? "—"} ·{" "}
              Payment: {result.ticket.payment_status ?? "—"}
            </p>
          )}
        </div>
      </div>

      {result.ticket && (
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Field label="Ticket ID" value={`#${result.ticket.ticket_id}`} />
          <Field label="Seat" value={result.ticket.seat_number} />
          <Field label="Holder" value={result.ticket.user_name} />
          {result.ticket.user_email && (
            <Field label="Email" value={result.ticket.user_email} />
          )}
          <Field label="Event" value={result.ticket.event_name} />
          {result.ticket.event_date && (
            <Field
              label="Date"
              value={new Date(result.ticket.event_date).toLocaleDateString("en-IN")}
            />
          )}
          {result.ticket.venue_name && (
            <Field label="Venue" value={result.ticket.venue_name} />
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[var(--accent-dark)]">{value}</p>
    </div>
  );
}
