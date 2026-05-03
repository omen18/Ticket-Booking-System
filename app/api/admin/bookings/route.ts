import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";

import { requireAdmin, AuthError } from "@/lib/auth/session";
import db from "@/lib/db";

interface BookingRow extends RowDataPacket {
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
  amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
}

interface SeatRow extends RowDataPacket {
  booking_id: number;
  seat_number: string;
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

  const [bookings] = await db.query<BookingRow[]>(
    `SELECT
       b.booking_id,
       b.user_id,
       u.name AS user_name,
       u.email AS user_email,
       b.event_id,
       e.event_name,
       e.event_date,
       v.venue_name,
       v.location,
       b.booking_date,
       p.amount,
       p.payment_method,
       p.status AS payment_status
     FROM Booking b
     JOIN Users u ON u.user_id = b.user_id
     JOIN Event e ON e.event_id = b.event_id
     JOIN Venue v ON v.venue_id = e.venue_id
     LEFT JOIN Payment p ON p.booking_id = b.booking_id
     ORDER BY b.booking_date DESC, b.booking_id DESC`,
  );

  if (bookings.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const bookingIds = bookings.map((b) => b.booking_id);
  const placeholders = bookingIds.map(() => "?").join(",");
  const [seatRows] = await db.query<SeatRow[]>(
    `SELECT t.booking_id, s.seat_number
     FROM Ticket t
     JOIN Seat s ON s.seat_id = t.seat_id
     WHERE t.booking_id IN (${placeholders})`,
    bookingIds,
  );

  const seatMap: Record<number, string[]> = {};
  for (const row of seatRows) {
    (seatMap[row.booking_id] ??= []).push(row.seat_number);
  }

  return NextResponse.json({
    data: bookings.map((b) => ({
      booking_id: b.booking_id,
      user_id: b.user_id,
      user_name: b.user_name,
      user_email: b.user_email,
      event_id: b.event_id,
      event_name: b.event_name,
      event_date: b.event_date,
      venue_name: b.venue_name,
      location: b.location,
      booking_date: b.booking_date,
      seats: seatMap[b.booking_id] ?? [],
      amount: Number(b.amount ?? 0),
      payment_method: b.payment_method ?? "N/A",
      payment_status: b.payment_status ?? "Pending",
    })),
  });
}
