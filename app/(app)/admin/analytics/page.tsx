"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, IndianRupee, Users, Ticket as TicketIcon, BarChart3 } from "lucide-react";

type Analytics = {
  kpis: {
    total_revenue: number;
    total_bookings: number;
    total_tickets: number;
    total_users: number;
    avg_order_value: number;
  };
  revenue_by_event: Array<{
    event_id: number;
    event_name: string;
    event_date: string;
    bookings: number;
    revenue: number;
  }>;
  revenue_by_category: Array<{
    category_id: number;
    category_name: string;
    bookings: number;
    revenue: number;
  }>;
  daily_trend: Array<{ day: string; bookings: number; revenue: number }>;
  payment_methods: Array<{ payment_method: string; count: number; revenue: number }>;
  occupancy: Array<{
    event_id: number;
    event_name: string;
    total_seats: number;
    booked_seats: number;
    occupancy_pct: number;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(json.error ?? "Failed to load analytics");
          return;
        }
        setData(json.data);
      } catch {
        if (active) setError("Network error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]">
        Loading analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">
        {error ?? "No data"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Reporting
        </p>
        <h1 className="mt-2 font-syne text-3xl font-bold text-[var(--accent-dark)]">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Revenue, occupancy, and booking trends across every event.
        </p>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi
          label="Total Revenue"
          value={formatCurrency(data.kpis.total_revenue)}
          icon={<IndianRupee size={16} />}
        />
        <Kpi
          label="Bookings"
          value={String(data.kpis.total_bookings)}
          icon={<TicketIcon size={16} />}
        />
        <Kpi
          label="Tickets Issued"
          value={String(data.kpis.total_tickets)}
          icon={<TicketIcon size={16} />}
        />
        <Kpi
          label="Unique Customers"
          value={String(data.kpis.total_users)}
          icon={<Users size={16} />}
        />
        <Kpi
          label="Avg Order"
          value={formatCurrency(Math.round(data.kpis.avg_order_value))}
          icon={<TrendingUp size={16} />}
        />
      </section>

      {/* Daily trend chart */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Last 30 days
            </p>
            <h2 className="mt-1 font-syne text-xl font-bold text-[var(--accent-dark)]">
              Daily revenue and bookings
            </h2>
          </div>
        </div>
        <DailyTrendChart points={data.daily_trend} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by event */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 font-syne text-xl font-bold text-[var(--accent-dark)]">
            Top events by revenue
          </h2>
          <BarList
            items={data.revenue_by_event.map((r) => ({
              label: r.event_name,
              value: r.revenue,
              meta: `${r.bookings} bookings`,
            }))}
            formatter={formatCurrency}
          />
        </section>

        {/* Revenue by category */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 font-syne text-xl font-bold text-[var(--accent-dark)]">
            Revenue by category
          </h2>
          <BarList
            items={data.revenue_by_category.map((r) => ({
              label: r.category_name,
              value: r.revenue,
              meta: `${r.bookings} bookings`,
            }))}
            formatter={formatCurrency}
          />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment methods */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 font-syne text-xl font-bold text-[var(--accent-dark)]">
            Payment methods
          </h2>
          <PaymentMethodChart methods={data.payment_methods} />
        </section>

        {/* Top occupancy */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 font-syne text-xl font-bold text-[var(--accent-dark)]">
            Highest occupancy
          </h2>
          <div className="space-y-3">
            {data.occupancy.slice(0, 6).map((row) => (
              <div key={row.event_id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[var(--accent-dark)]">{row.event_name}</span>
                  <span className="text-[var(--text-secondary)]">
                    {row.booked_seats}/{row.total_seats} ({row.occupancy_pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgba(18,123,163,0.08)]">
                  <div
                    className="h-full bg-[var(--accent)] transition-all"
                    style={{ width: `${row.occupancy_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <p className="mt-2 font-syne text-2xl font-bold text-[var(--accent-dark)]">{value}</p>
    </div>
  );
}

function BarList({
  items,
  formatter,
}: {
  items: Array<{ label: string; value: number; meta?: string }>;
  formatter: (n: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.every((i) => i.value === 0)) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No revenue recorded yet.</p>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate font-medium text-[var(--accent-dark)]">{item.label}</span>
            <span className="text-[var(--text-secondary)]">{formatter(item.value)}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-[rgba(18,123,163,0.08)]">
            <div
              className="h-full bg-[var(--accent)] transition-all"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          {item.meta && (
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{item.meta}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DailyTrendChart({
  points,
}: {
  points: Array<{ day: string; bookings: number; revenue: number }>;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--text-muted)]">
        No bookings in the last 30 days.
      </div>
    );
  }

  const W = 800;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

  const maxRev = Math.max(...points.map((p) => p.revenue), 1);

  const xStep = (W - PAD.left - PAD.right) / Math.max(points.length - 1, 1);
  const yScale = (v: number) => PAD.top + (1 - v / maxRev) * (H - PAD.top - PAD.bottom);
  const xCoord = (i: number) => PAD.left + i * xStep;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xCoord(i)} ${yScale(p.revenue)}`)
    .join(" ");
  const area = `${path} L ${xCoord(points.length - 1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily revenue trend">
      {/* Y grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(maxRev * f)}
            y2={yScale(maxRev * f)}
            stroke="#cce3ef"
            strokeDasharray="4 4"
          />
          <text
            x={PAD.left - 8}
            y={yScale(maxRev * f) + 4}
            fontSize="10"
            textAnchor="end"
            fill="#7996a9"
          >
            {Math.round(maxRev * f).toLocaleString("en-IN")}
          </text>
        </g>
      ))}

      {/* Area */}
      <path d={area} fill="rgba(18,123,163,0.14)" />
      {/* Line */}
      <path d={path} fill="none" stroke="#127ba3" strokeWidth={2} />
      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xCoord(i)} cy={yScale(p.revenue)} r={3} fill="#127ba3" />
          <title>
            {p.day}: {formatCurrency(p.revenue)} ({p.bookings} bookings)
          </title>
        </g>
      ))}

      {/* X labels (sparse) */}
      {points
        .filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0)
        .map((p, _idx) => {
          const realIdx = points.indexOf(p);
          return (
            <text
              key={p.day}
              x={xCoord(realIdx)}
              y={H - 8}
              fontSize="10"
              textAnchor="middle"
              fill="#7996a9"
            >
              {p.day.slice(5)}
            </text>
          );
        })}
    </svg>
  );
}

function PaymentMethodChart({
  methods,
}: {
  methods: Array<{ payment_method: string; count: number; revenue: number }>;
}) {
  const total = useMemo(() => methods.reduce((s, m) => s + m.count, 0), [methods]);
  if (total === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No payments yet.</p>;
  }
  const colors = ["#127ba3", "#35a8d6", "#66c1e5", "#95d7ef", "#0d6080"];
  return (
    <div className="space-y-3">
      {methods.map((m, i) => {
        const pct = (m.count / total) * 100;
        return (
          <div key={m.payment_method}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-[var(--accent-dark)]">{m.payment_method}</span>
              <span className="text-[var(--text-secondary)]">
                {m.count} ({pct.toFixed(0)}%) · {formatCurrency(m.revenue)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(18,123,163,0.08)]">
              <div
                className="h-full transition-all"
                style={{ width: `${pct}%`, background: colors[i % colors.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
