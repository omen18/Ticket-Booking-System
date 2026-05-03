import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";

import db from "@/lib/db";

interface BookingRow extends RowDataPacket {
  booking_id: number;
  user_id: number;
  event_id: number;
  booking_date: string;
}

interface TicketRow extends RowDataPacket {
  ticket_id: number;
  booking_id: number;
  seat_id: number;
  event_id: number;
  qr_code: string;
}

interface PaymentRow extends RowDataPacket {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  status: string;
}

interface EventRow extends RowDataPacket {
  event_id: number;
  event_name: string;
  event_date: string;
  venue_id: number;
}

interface VenueRow extends RowDataPacket {
  venue_id: number;
  venue_name: string;
  location: string;
}

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

interface SeatRow extends RowDataPacket {
  seat_id: number;
  seat_number: string;
}

const IS_DEV = process.env.NODE_ENV !== "production";
const DEV_BOOKING_ID = 99999;

function devMockConfirmation(bookingId: number) {
  return NextResponse.json({
    data: {
      booking: { booking_id: bookingId, booking_date: new Date().toISOString().slice(0, 10) },
      event:   { event_name: "Demo Event — AR Rahman Concert", event_date: "2026-05-05" },
      venue:   { venue_name: "Music Arena Bangalore", location: "Bangalore" },
      payment: { amount: 1029, payment_method: "UPI", status: "Completed" },
      user:    { name: "Demo User", email: "demo@example.com", phone: "9999999999" },
      tickets: [
        { ticket_id: 90001, qr_code: "DEV-BKG-99999-SA1", seat_number: "A1" },
        { ticket_id: 90002, qr_code: "DEV-BKG-99999-SA2", seat_number: "A2" },
      ],
      seatLabels: ["A1", "A2"],
      totalSeats: 2,
      dev_mode: true,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { error: "Invalid booking id" },
        { status: 400 }
      );
    }

    // Dev mock booking — returned by book-ticket when DB is unavailable.
    if (IS_DEV && bookingId === DEV_BOOKING_ID) {
      return devMockConfirmation(bookingId);
    }

    // Query booking details
    const [bookings] = await db.query<BookingRow[]>(
      "SELECT booking_id, user_id, event_id, booking_date FROM Booking WHERE booking_id = ? LIMIT 1",
      [bookingId]
    );

    const booking = bookings[0];

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Query tickets for this booking
    const [tickets] = await db.query<TicketRow[]>(
      "SELECT ticket_id, booking_id, seat_id, event_id, qr_code FROM Ticket WHERE booking_id = ?",
      [bookingId]
    );

    // Query payment for this booking
    const [payments] = await db.query<PaymentRow[]>(
      "SELECT payment_id, booking_id, amount, payment_method, status FROM Payment WHERE booking_id = ? LIMIT 1",
      [bookingId]
    );

    const payment = payments[0];

    if (!payment) {
      return NextResponse.json(
        { error: "Payment information not found" },
        { status: 404 }
      );
    }

    // Query event details
    const [events] = await db.query<EventRow[]>(
      "SELECT event_id, event_name, event_date, venue_id FROM Event WHERE event_id = ? LIMIT 1",
      [booking.event_id]
    );

    const event = events[0];

    if (!event) {
      return NextResponse.json(
        { error: "Event details not found" },
        { status: 404 }
      );
    }

    // Query venue details
    const [venues] = await db.query<VenueRow[]>(
      "SELECT venue_id, venue_name, location FROM Venue WHERE venue_id = ? LIMIT 1",
      [event.venue_id]
    );

    const venue = venues[0];

    if (!venue) {
      return NextResponse.json(
        { error: "Venue details not found" },
        { status: 404 }
      );
    }

    // Query user details
    const [users] = await db.query<UserRow[]>(
      "SELECT user_id, name, email, phone FROM Users WHERE user_id = ? LIMIT 1",
      [booking.user_id]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { error: "User details not found" },
        { status: 404 }
      );
    }

    // Query seat numbers for all tickets
    // Query seat numbers for all tickets
    let seats: SeatRow[] = [];
    if (tickets.length > 0) {
      const seatIds = tickets.map((t) => t.seat_id);
      const placeholders = seatIds.map(() => "?").join(",");
      const [seatResults] = await db.query<SeatRow[]>(
        `SELECT seat_id, seat_number FROM Seat WHERE seat_id IN (${placeholders})`,
        [...seatIds]
      );
      seats = seatResults;
    }

    const seatMap = seats.reduce(
      (acc, seat) => {
        acc[seat.seat_id] = seat.seat_number;
        return acc;
      },
      {} as Record<number, string>
    );

    const ticketData = tickets.map((ticket) => ({
      ticket_id: ticket.ticket_id,
      qr_code: ticket.qr_code,
      seat_number: seatMap[ticket.seat_id] || `Seat ${ticket.seat_id}`,
    }));

    const seatLabels = tickets.map((t) => seatMap[t.seat_id] || `Seat ${t.seat_id}`);

    const payload = {
      booking: {
        booking_id: booking.booking_id,
        booking_date: booking.booking_date,
      },
      event: {
        event_name: event.event_name,
        event_date: event.event_date,
      },
      venue: {
        venue_name: venue.venue_name,
        location: venue.location,
      },
      payment: {
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
      },
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      tickets: ticketData,
      seatLabels,
      totalSeats: tickets.length,
    };

    return NextResponse.json({ data: payload }, { status: 200 });
  } catch (error) {
    console.error("Confirmation API error:", error);
    if (IS_DEV) {
      console.warn("[dev] confirmation DB unavailable, returning mock data");
      return devMockConfirmation(DEV_BOOKING_ID);
    }
    return NextResponse.json(
      { error: "Unable to fetch booking details" },
      { status: 500 }
    );
  }
}
