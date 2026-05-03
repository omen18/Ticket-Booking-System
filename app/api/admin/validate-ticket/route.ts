import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { z } from "zod";

import { requireAdmin, AuthError } from "@/lib/auth/session";
import db from "@/lib/db";

// QR validation works in two modes:
//   GET  ?qr=...  — look up the ticket and return its details + status
//   POST { qr }   — same lookup, but log a check-in to Transaction_Log
//
// We don't add a "used" flag to Ticket since the schema is fixed. Instead we
// look at Transaction_Log for action_type = 'CHECKIN' against the booking.
// In production you'd add a Ticket.used_at column.

interface TicketRow extends RowDataPacket {
  ticket_id: number;
  booking_id: number;
  qr_code: string;
  seat_number: string;
  event_name: string;
  event_date: string;
  venue_name: string;
  user_name: string;
  user_email: string;
  payment_status: string | null;
}

interface CheckinRow extends RowDataPacket {
  txn_id: number;
  txn_time: Date;
}

const querySchema = z.object({
  qr: z.string().trim().min(4),
});

async function lookupTicket(qr: string) {
  const [rows] = await db.query<TicketRow[]>(
    `SELECT
       t.ticket_id, t.booking_id, t.qr_code,
       s.seat_number,
       e.event_name, e.event_date,
       v.venue_name,
       u.name AS user_name, u.email AS user_email,
       p.status AS payment_status
     FROM Ticket t
     JOIN Seat    s ON s.seat_id  = t.seat_id
     JOIN Booking b ON b.booking_id = t.booking_id
     JOIN Event   e ON e.event_id = t.event_id
     JOIN Venue   v ON v.venue_id = e.venue_id
     JOIN Users   u ON u.user_id  = b.user_id
     LEFT JOIN Payment p ON p.booking_id = b.booking_id
     WHERE t.qr_code = ?
     LIMIT 1`,
    [qr],
  );
  return rows[0] ?? null;
}

async function findCheckin(bookingId: number, ticketId: number) {
  // We tag check-ins with action_type = 'CHECKIN-{ticket_id}' so we can find
  // a specific ticket's check-in even though Transaction_Log only references
  // booking_id.
  const [rows] = await db.query<CheckinRow[]>(
    `SELECT txn_id, txn_time
     FROM Transaction_Log
     WHERE booking_id = ? AND action_type = ?
     LIMIT 1`,
    [bookingId, `CHECKIN-${ticketId}`],
  );
  return rows[0] ?? null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ qr: url.searchParams.get("qr") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "QR code is required" }, { status: 400 });
  }

  const ticket = await lookupTicket(parsed.data.qr);
  if (!ticket) {
    return NextResponse.json(
      { data: { valid: false, reason: "Ticket not found" } },
      { status: 404 },
    );
  }

  const checkin = await findCheckin(ticket.booking_id, ticket.ticket_id);

  return NextResponse.json({
    data: {
      valid: true,
      ticket: {
        ticket_id: ticket.ticket_id,
        booking_id: ticket.booking_id,
        seat_number: ticket.seat_number,
        event_name: ticket.event_name,
        event_date: ticket.event_date,
        venue_name: ticket.venue_name,
        user_name: ticket.user_name,
        user_email: ticket.user_email,
        payment_status: ticket.payment_status ?? "Unknown",
      },
      checked_in_at: checkin?.txn_time ?? null,
      already_used: !!checkin,
    },
  });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const body = await request.json().catch(() => null);
  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "QR code is required" }, { status: 400 });
  }

  const ticket = await lookupTicket(parsed.data.qr);
  if (!ticket) {
    return NextResponse.json(
      { data: { valid: false, reason: "Ticket not found" } },
      { status: 404 },
    );
  }

  // Check for prior check-in
  const existing = await findCheckin(ticket.booking_id, ticket.ticket_id);
  if (existing) {
    return NextResponse.json(
      {
        data: {
          valid: false,
          reason: "Ticket already checked in",
          checked_in_at: existing.txn_time,
          ticket: {
            ticket_id: ticket.ticket_id,
            seat_number: ticket.seat_number,
            event_name: ticket.event_name,
            user_name: ticket.user_name,
          },
        },
      },
      { status: 409 },
    );
  }

  // Reject if payment not completed
  if (ticket.payment_status !== "Completed") {
    return NextResponse.json(
      {
        data: {
          valid: false,
          reason: `Payment status is ${ticket.payment_status ?? "unknown"}`,
        },
      },
      { status: 402 },
    );
  }

  // Log the check-in
  await db.query(
    "INSERT INTO Transaction_Log (booking_id, action_type) VALUES (?, ?)",
    [ticket.booking_id, `CHECKIN-${ticket.ticket_id}`],
  );

  return NextResponse.json({
    data: {
      valid: true,
      checked_in: true,
      checked_in_at: new Date(),
      ticket: {
        ticket_id: ticket.ticket_id,
        booking_id: ticket.booking_id,
        seat_number: ticket.seat_number,
        event_name: ticket.event_name,
        event_date: ticket.event_date,
        venue_name: ticket.venue_name,
        user_name: ticket.user_name,
        user_email: ticket.user_email,
      },
    },
  });
}
