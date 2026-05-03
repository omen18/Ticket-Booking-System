"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Users, Calendar, BookOpen, IndianRupee, type LucideIcon } from "lucide-react";

import { useUserStore } from "@/lib/store/userStore";

type Option = { id: number; label: string };

type ManagedEvent = {
  event_id: number;
  event_name: string;
  event_date: string;
  venue_id: number;
  category_id: number;
  organizer_id: number;
  admin_id: number;
};

type AdminUser = {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  is_admin: number;
  booking_count: number;
};

type AdminBooking = {
  booking_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  event_id: number;
  event_name: string;
  event_date: string;
  venue_name: string;
  location: string;
  booking_date: string;
  seats: string[];
  amount: number;
  payment_method: string;
  payment_status: string;
};

export default function AdminPage() {
  const user = useUserStore((state) => state.user);

  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [venues, setVenues] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [organizers, setOrganizers] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venueId, setVenueId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [organizerId, setOrganizerId] = useState("");

  const adminEmail = user?.email ?? "";

  async function fetchDashboardData() {
    if (!adminEmail) return;
    setError("");
    setLoading(true);
    try {
      const [eventsRes, bookingsRes, lookupsRes, usersRes] = await Promise.all([
        fetch("/api/admin/events", { cache: "no-store" }),
        fetch("/api/admin/bookings", { cache: "no-store" }),
        fetch("/api/admin/lookups", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);

      if (!eventsRes.ok || !bookingsRes.ok || !lookupsRes.ok || !usersRes.ok) {
        setError("Unable to load admin dashboard data");
        return;
      }

      const [eventsJson, bookingsJson, lookupsJson, usersJson] = await Promise.all([
        eventsRes.json(),
        bookingsRes.json(),
        lookupsRes.json(),
        usersRes.json(),
      ]);

      setEvents(eventsJson.data ?? []);
      setBookings(bookingsJson.data ?? []);
      setUsers(usersJson.data ?? []);
      setVenues(
        (lookupsJson.data?.venues ?? []).map((v: { venue_id: number; venue_name: string }) => ({
          id: v.venue_id,
          label: v.venue_name,
        })),
      );
      setCategories(
        (lookupsJson.data?.categories ?? []).map((c: { category_id: number; category_name: string }) => ({
          id: c.category_id,
          label: c.category_name,
        })),
      );
      setOrganizers(
        (lookupsJson.data?.organizers ?? []).map((o: { organizer_id: number; name: string }) => ({
          id: o.organizer_id,
          label: o.name,
        })),
      );
    } catch {
      setError("Network error while loading admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail]);

  async function handleCreateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!adminEmail) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: eventName,
          event_date: eventDate,
          venue_id: Number(venueId),
          category_id: Number(categoryId),
          organizer_id: Number(organizerId),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? json.error ?? "Unable to create event");
        return;
      }
      setEventName(""); setEventDate(""); setVenueId(""); setCategoryId(""); setOrganizerId("");
      await fetchDashboardData();
    } catch {
      setError("Network error while creating event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent(eventId: number) {
    if (!adminEmail) return;
    if (!window.confirm("Delete this event? This will fail if bookings exist.")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Unable to delete event"); return; }
      await fetchDashboardData();
    } catch {
      setError("Network error while deleting event");
    }
  }

  const bookingRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + Number(b.amount ?? 0), 0),
    [bookings],
  );

  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--border)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Admin Console</p>
        <h1 className="mt-1 font-syne text-3xl font-bold text-[var(--accent-dark)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage events, monitor bookings, and view all registered users.
        </p>
      </header>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Metric cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Registered Users" value={String(users.length)} icon={Users} color="bg-blue-500" />
        <MetricCard label="Total Events" value={String(events.length)} icon={Calendar} color="bg-violet-500" />
        <MetricCard label="Total Bookings" value={String(bookings.length)} icon={BookOpen} color="bg-emerald-500" />
        <MetricCard label="Revenue" value={fmt.format(bookingRevenue)} icon={IndianRupee} color="bg-amber-500" />
      </section>

      {/* Users */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">All Users</h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{users.length} registered accounts</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">User</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Phone</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Role</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--accent-dark)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--text-secondary)]">{u.phone}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_admin
                          ? "bg-[var(--accent)] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {u.booking_count} {u.booking_count === 1 ? "booking" : "bookings"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add new event */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Add New Event</h2>
        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreateEvent}>
          <Field label="Event name">
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              placeholder="Summer Music Night"
              required
            />
          </Field>
          <Field label="Event date">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
          </Field>
          <Field label="Venue">
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            >
              <option value="">Select venue</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Organizer">
            <select
              value={organizerId}
              onChange={(e) => setOrganizerId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            >
              <option value="">Select organizer</option>
              {organizers.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Event"}
            </button>
          </div>
        </form>
      </section>

      {/* Events */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Events</h2>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{events.length} events in the system</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                {["Name", "Date", "Venue", "Category", "Organizer", ""].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.event_id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-secondary)]">
                  <td className="py-3 pr-4 font-medium text-[var(--accent-dark)]">{ev.event_name}</td>
                  <td className="py-3 pr-4 text-[var(--text-secondary)]">
                    {new Date(ev.event_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 pr-4 text-[var(--text-secondary)]">#{ev.venue_id}</td>
                  <td className="py-3 pr-4 text-[var(--text-secondary)]">#{ev.category_id}</td>
                  <td className="py-3 pr-4 text-[var(--text-secondary)]">#{ev.organizer_id}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDeleteEvent(ev.event_id)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bookings */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">All Bookings</h2>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{bookings.length} bookings total</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                {["#", "User", "Event", "Seats", "Amount", "Payment"].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.booking_id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-secondary)]">
                  <td className="py-3 pr-4 text-xs text-[var(--text-secondary)]">#{b.booking_id}</td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[var(--accent-dark)]">{b.user_name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{b.user_email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[var(--accent-dark)]">{b.event_name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{b.venue_name}, {b.location}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--text-secondary)]">
                    {b.seats.join(", ") || "—"}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-[var(--accent-dark)]">
                    {fmt.format(Number(b.amount ?? 0))}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        b.payment_status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : b.payment_status === "Failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {b.payment_method} · {b.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({
  label, value, icon: Icon, color,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
          <p className="mt-2 font-syne text-2xl font-bold text-[var(--accent-dark)]">{value}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </article>
  );
}
