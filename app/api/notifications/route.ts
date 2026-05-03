import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import { getSession } from "@/lib/auth/session";

interface BookingRow extends RowDataPacket {
  booking_id: number;
  event_name: string;
  event_date: string;
  venue_name: string;
  booking_date: string;
  amount: number;
  payment_status: string;
}

const IS_DEV = process.env.NODE_ENV !== "production";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bookings: BookingRow[] = [];

  try {
    [bookings] = await db.query<BookingRow[]>(
      `SELECT
         b.booking_id, e.event_name, e.event_date,
         v.venue_name, b.booking_date,
         p.amount, p.status AS payment_status
       FROM Booking b
       JOIN Event e ON e.event_id = b.event_id
       JOIN Venue v ON v.venue_id = e.venue_id
       LEFT JOIN Payment p ON p.booking_id = b.booking_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC
       LIMIT 10`,
      [session.user_id],
    );
  } catch (err) {
    if (!IS_DEV) {
      console.error("notifications error:", err);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
    console.warn("[dev] notifications DB unavailable, returning mock notifications");
    bookings = [
      {
        booking_id: 99999,
        event_name: "AR Rahman Concert",
        event_date: "2026-05-05",
        venue_name: "Music Arena Bangalore",
        booking_date: new Date().toISOString().slice(0, 10),
        amount: 1029,
        payment_status: "Completed",
      } as BookingRow,
    ];
  }

  const today = new Date();

  const notifications = bookings.flatMap((b) => {
    const items: {
      id: string;
      type: "booking" | "upcoming" | "reminder";
      title: string;
      body: string;
      time: string;
      href: string;
    }[] = [];

    // Booking confirmed notification
    items.push({
      id: `booking-${b.booking_id}`,
      type: "booking",
      title: "Booking Confirmed",
      body: `${b.event_name} at ${b.venue_name} — ₹${Number(b.amount).toLocaleString("en-IN")}`,
      time: b.booking_date,
      href: `/confirmation/${b.booking_id}`,
    });

    // Upcoming event reminder if within 7 days
    const eventDate = new Date(b.event_date);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) {
      items.push({
        id: `upcoming-${b.booking_id}`,
        type: "upcoming",
        title: daysUntil === 0 ? "Event is Today!" : `Event in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        body: `${b.event_name} · ${b.venue_name}`,
        time: b.event_date,
        href: `/confirmation/${b.booking_id}`,
      });
    }

    return items;
  });

  return NextResponse.json({ data: notifications });
}
