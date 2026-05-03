import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";

const IS_DEV = process.env.NODE_ENV !== "production";

interface BookingRow extends RowDataPacket {
  booking_id: number;
  event_id: number;
  booking_date: string;
  event_name: string;
  event_date: string;
  venue_name: string;
  location: string;
  amount: number;
  payment_method: string;
  payment_status: string;
}

interface SeatRow extends RowDataPacket {
  booking_id: number;
  seat_number: string;
}

interface Context {
  params: Promise<{ user_id: string }>;
}

export async function GET(_: Request, { params }: Context) {
  const { user_id } = await params;
  const userId = Number(user_id);

  if (Number.isNaN(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  let bookings: BookingRow[];
  let seatRows: SeatRow[];

  try {
    [bookings] = await db.query<BookingRow[]>(
      `SELECT
         b.booking_id, b.event_id, b.booking_date,
         e.event_name, e.event_date,
         v.venue_name, v.location,
         p.amount, p.payment_method, p.status AS payment_status
       FROM Booking b
       JOIN Event e ON e.event_id = b.event_id
       JOIN Venue v ON v.venue_id = e.venue_id
       LEFT JOIN Payment p ON p.booking_id = b.booking_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );

    if (bookings.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const bookingIds = bookings.map((b) => b.booking_id);
    const placeholders = bookingIds.map(() => "?").join(",");
    [seatRows] = await db.query<SeatRow[]>(
      `SELECT t.booking_id, s.seat_number
       FROM Ticket t
       JOIN Seat s ON s.seat_id = t.seat_id
       WHERE t.booking_id IN (${placeholders})`,
      bookingIds
    );
  } catch (err) {
    if (!IS_DEV) {
      console.error("profile bookings error:", err);
      return NextResponse.json({ error: "Unable to fetch bookings" }, { status: 500 });
    }
    console.warn("[dev] profile bookings DB unavailable, returning mock data");
    return NextResponse.json({
      data: [
        {
          booking_id: 99999,
          event_id: 1,
          booking_date: new Date().toISOString().slice(0, 10),
          event_name: "Demo Event — AR Rahman Concert",
          event_date: "2026-05-05",
          venue_name: "Music Arena Bangalore",
          location: "Bangalore",
          seats: ["A1", "A2"],
          amount: 1029,
          payment_method: "UPI",
          payment_status: "Completed",
        },
      ],
    });
  }

  const seatMap: Record<number, string[]> = {};
  for (const row of seatRows) {
    (seatMap[row.booking_id] ??= []).push(row.seat_number);
  }

  const data = bookings.map((b) => ({
    booking_id: b.booking_id,
    event_id: b.event_id,
    booking_date: b.booking_date,
    event_name: b.event_name,
    event_date: b.event_date,
    venue_name: b.venue_name,
    location: b.location,
    seats: seatMap[b.booking_id] ?? [],
    amount: b.amount ?? 0,
    payment_method: b.payment_method ?? "Card",
    payment_status: b.payment_status ?? "Completed",
  }));

  return NextResponse.json({ data });
}
