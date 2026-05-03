import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";

import { requireAdmin, AuthError } from "@/lib/auth/session";
import db from "@/lib/db";

// All analytics queries run in parallel. Each query is keyed off Payment so
// only completed transactions count toward revenue. We never compute revenue
// from Booking alone, because a booking without a payment shouldn't count.
//
// All aggregations are LEFT-JOINed from the entity (Event, Category, etc.)
// so categories with zero revenue still appear with 0 — important for charts.

interface KpiRow extends RowDataPacket {
  total_revenue: number;
  total_bookings: number;
  total_tickets: number;
  total_users: number;
  avg_order_value: number | null;
}

interface RevenueByEventRow extends RowDataPacket {
  event_id: number;
  event_name: string;
  event_date: string;
  bookings: number;
  revenue: number;
}

interface RevenueByCategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
  bookings: number;
  revenue: number;
}

interface DailyRow extends RowDataPacket {
  day: string;
  bookings: number;
  revenue: number;
}

interface PaymentMethodRow extends RowDataPacket {
  payment_method: string;
  count: number;
  revenue: number;
}

interface OccupancyRow extends RowDataPacket {
  event_id: number;
  event_name: string;
  total_seats: number;
  booked_seats: number;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const [
    [kpis],
    [revenueByEvent],
    [revenueByCategory],
    [daily],
    [paymentMethods],
    [occupancy],
  ] = await Promise.all([
    db.query<KpiRow[]>(`
      SELECT
        COALESCE(SUM(p.amount), 0)              AS total_revenue,
        COUNT(DISTINCT b.booking_id)            AS total_bookings,
        COUNT(t.ticket_id)                      AS total_tickets,
        COUNT(DISTINCT b.user_id)               AS total_users,
        COALESCE(AVG(p.amount), 0)              AS avg_order_value
      FROM Booking b
      LEFT JOIN Payment p ON p.booking_id = b.booking_id AND p.status = 'Completed'
      LEFT JOIN Ticket  t ON t.booking_id = b.booking_id
    `),

    db.query<RevenueByEventRow[]>(`
      SELECT
        e.event_id,
        e.event_name,
        e.event_date,
        COUNT(DISTINCT b.booking_id)           AS bookings,
        COALESCE(SUM(p.amount), 0)             AS revenue
      FROM Event e
      LEFT JOIN Booking b ON b.event_id = e.event_id
      LEFT JOIN Payment p ON p.booking_id = b.booking_id AND p.status = 'Completed'
      GROUP BY e.event_id, e.event_name, e.event_date
      ORDER BY revenue DESC
      LIMIT 10
    `),

    db.query<RevenueByCategoryRow[]>(`
      SELECT
        c.category_id,
        c.category_name,
        COUNT(DISTINCT b.booking_id)           AS bookings,
        COALESCE(SUM(p.amount), 0)             AS revenue
      FROM Category c
      LEFT JOIN Event   e ON e.category_id = c.category_id
      LEFT JOIN Booking b ON b.event_id = e.event_id
      LEFT JOIN Payment p ON p.booking_id = b.booking_id AND p.status = 'Completed'
      GROUP BY c.category_id, c.category_name
      ORDER BY revenue DESC
    `),

    // Last 30 days of bookings — fills gaps with zero by joining a date series
    db.query<DailyRow[]>(`
      SELECT
        DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS day,
        COUNT(DISTINCT b.booking_id)             AS bookings,
        COALESCE(SUM(p.amount), 0)               AS revenue
      FROM Booking b
      LEFT JOIN Payment p ON p.booking_id = b.booking_id AND p.status = 'Completed'
      WHERE b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE_FORMAT(b.booking_date, '%Y-%m-%d')
      ORDER BY day ASC
    `),

    db.query<PaymentMethodRow[]>(`
      SELECT
        p.payment_method,
        COUNT(*)              AS count,
        SUM(p.amount)         AS revenue
      FROM Payment p
      WHERE p.status = 'Completed'
      GROUP BY p.payment_method
      ORDER BY count DESC
    `),

    db.query<OccupancyRow[]>(`
      SELECT
        e.event_id,
        e.event_name,
        (SELECT COUNT(*) FROM Seat s WHERE s.venue_id = e.venue_id) AS total_seats,
        (SELECT COUNT(*) FROM Ticket t WHERE t.event_id = e.event_id) AS booked_seats
      FROM Event e
      ORDER BY (booked_seats / NULLIF(total_seats, 0)) DESC
      LIMIT 10
    `),
  ]);

  return NextResponse.json({
    data: {
      kpis: {
        total_revenue: Number(kpis[0]?.total_revenue ?? 0),
        total_bookings: Number(kpis[0]?.total_bookings ?? 0),
        total_tickets: Number(kpis[0]?.total_tickets ?? 0),
        total_users: Number(kpis[0]?.total_users ?? 0),
        avg_order_value: Number(kpis[0]?.avg_order_value ?? 0),
      },
      revenue_by_event: revenueByEvent.map((r) => ({
        event_id: r.event_id,
        event_name: r.event_name,
        event_date: r.event_date,
        bookings: Number(r.bookings),
        revenue: Number(r.revenue),
      })),
      revenue_by_category: revenueByCategory.map((r) => ({
        category_id: r.category_id,
        category_name: r.category_name,
        bookings: Number(r.bookings),
        revenue: Number(r.revenue),
      })),
      daily_trend: daily.map((r) => ({
        day: r.day,
        bookings: Number(r.bookings),
        revenue: Number(r.revenue),
      })),
      payment_methods: paymentMethods.map((r) => ({
        payment_method: r.payment_method,
        count: Number(r.count),
        revenue: Number(r.revenue),
      })),
      occupancy: occupancy.map((r) => ({
        event_id: r.event_id,
        event_name: r.event_name,
        total_seats: Number(r.total_seats),
        booked_seats: Number(r.booked_seats),
        occupancy_pct:
          r.total_seats > 0
            ? Math.round((Number(r.booked_seats) / Number(r.total_seats)) * 100)
            : 0,
      })),
    },
  });
}
