// app/api/book-ticket/route.ts
//
// Single endpoint that creates Booking + Ticket(s) + Payment + Booking_Discount
// atomically. Replaces the 4-call client flow in PaymentStep.tsx, which had a
// failure mode where a network drop between steps could leave bookings without
// payments.
//
// Key invariants enforced HERE rather than trusted from the client:
//   - The user owns active locks on every seat (no surprise "free" seat)
//   - Seats are not already in the Ticket table for this event
//   - The discount code (if provided) is currently valid
//   - The total amount is computed server-side from seat prices + discount

import { NextResponse } from "next/server";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import db from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth/session";
import {
  assertLocksValidWithin,
  deleteLocksWithin,
} from "@/lib/services/seatLock";
import { SEAT_PRICE, CONVENIENCE_FEE, GST_RATE } from "@/lib/store/bookingStore";

const requestSchema = z.object({
  event_id: z.number().int().positive(),
  seat_ids: z.array(z.number().int().positive()).min(1).max(6),
  payment_method: z.enum(["Credit Card", "Debit Card", "UPI", "Net Banking"]),
  discount_code: z.string().trim().optional(),
});

interface SeatRow extends RowDataPacket {
  seat_id: number;
  seat_number: string;
  venue_id: number;
}

interface EventRow extends RowDataPacket {
  event_id: number;
  venue_id: number;
}

interface DiscountRow extends RowDataPacket {
  discount_id: number;
  code: string;
  percentage: number;
  expiry_date: Date;
}

function priceForSeat(seatNumber: string): number {
  const prefix = seatNumber[0]?.toUpperCase() ?? "E";
  return SEAT_PRICE[prefix] ?? 150;
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { event_id, seat_ids, payment_method, discount_code } = parsed.data;
  const userId = session.user_id;

  // Dev fallback: if the DB is unreachable, return a mock booking so the full
  // UI flow (payment → confirmation) can be exercised without a database.
  const IS_DEV = process.env.NODE_ENV !== "production";
  let conn;
  try {
    conn = await db.getConnection();
  } catch (dbErr) {
    if (!IS_DEV) throw dbErr;
    console.warn("[dev] book-ticket DB unavailable, using mock booking:", dbErr instanceof Error ? dbErr.message : dbErr);
    const convFee = CONVENIENCE_FEE * seat_ids.length;
    const gst = Math.round(convFee * GST_RATE * 100) / 100;
    const subtotal = seat_ids.length * 500;
    return NextResponse.json(
      {
        data: {
          booking_id: 99999,
          ticket_ids: seat_ids.map((_, i) => 90000 + i),
          payment_id: 99999,
          subtotal,
          discount_amount: 0,
          convenience_fee: convFee,
          gst,
          total: subtotal + convFee + gst,
          dev_mode: true,
        },
      },
      { status: 201 },
    );
  }

  try {
    await conn.beginTransaction();

    // ─── 1. Validate event exists ───────────────────────────────────────────
    const [eventRows] = await conn.execute<EventRow[]>(
      "SELECT event_id, venue_id FROM Event WHERE event_id = ? LIMIT 1",
      [event_id],
    );
    if (eventRows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const venueId = eventRows[0].venue_id;

    // ─── 2. Verify seats belong to this venue and load their numbers ────────
    const seatPlaceholders = seat_ids.map(() => "?").join(",");
    const [seatRows] = await conn.execute<SeatRow[]>(
      `SELECT seat_id, seat_number, venue_id
       FROM Seat
       WHERE seat_id IN (${seatPlaceholders}) AND venue_id = ?`,
      [...seat_ids, venueId],
    );
    if (seatRows.length !== seat_ids.length) {
      await conn.rollback();
      return NextResponse.json(
        { error: "One or more seats are not valid for this event" },
        { status: 400 },
      );
    }

    // ─── 3. Verify the user holds valid locks on every seat ─────────────────
    const validLocked = await assertLocksValidWithin(
      conn,
      userId,
      event_id,
      seat_ids,
    );
    if (validLocked.length !== seat_ids.length) {
      await conn.rollback();
      return NextResponse.json(
        {
          error:
            "Your seat hold expired or was lost. Please reselect your seats.",
        },
        { status: 409 },
      );
    }

    // ─── 4. Belt + suspenders: ensure no Ticket already exists for these
    //        seats. The unique constraint (event_id, seat_id) on Ticket
    //        will also enforce this on insert, but checking first lets us
    //        return a clean 409 instead of a 500 from the constraint.
    const [existingTickets] = await conn.execute<RowDataPacket[]>(
      `SELECT seat_id FROM Ticket
       WHERE event_id = ? AND seat_id IN (${seatPlaceholders})
       FOR UPDATE`,
      [event_id, ...seat_ids],
    );
    if (existingTickets.length > 0) {
      await conn.rollback();
      return NextResponse.json(
        { error: "Some seats were just booked by another user" },
        { status: 409 },
      );
    }

    // ─── 5. Compute price server-side ───────────────────────────────────────
    const subtotal = seatRows.reduce(
      (sum, s) => sum + priceForSeat(s.seat_number),
      0,
    );
    const convFee = CONVENIENCE_FEE * seat_ids.length;
    const gst = Math.round(convFee * GST_RATE * 100) / 100;

    let discount: DiscountRow | null = null;
    if (discount_code) {
      const [discountRows] = await conn.execute<DiscountRow[]>(
        `SELECT discount_id, code, percentage, expiry_date
         FROM Discount
         WHERE LOWER(code) = LOWER(?) AND expiry_date >= CURDATE()
         LIMIT 1`,
        [discount_code],
      );
      if (discountRows.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: "Discount code is invalid or expired" },
          { status: 400 },
        );
      }
      discount = discountRows[0];
    }

    const discountAmt = discount
      ? Math.round((subtotal * Number(discount.percentage)) / 100 * 100) / 100
      : 0;
    const total = Math.max(0, subtotal - discountAmt + convFee + gst);

    // ─── 6. Insert Booking ──────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const [bookingResult] = await conn.execute<ResultSetHeader>(
      "INSERT INTO Booking (user_id, event_id, booking_date) VALUES (?, ?, ?)",
      [userId, event_id, today],
    );
    const bookingId = bookingResult.insertId;

    // ─── 7. Insert Tickets. Unique constraint will reject any duplicate. ────
    const ticketIds: number[] = [];
    for (const seat of seatRows) {
      // QR payload — in real life, sign this with HMAC so admin scanners
      // can validate authenticity. For now, an unguessable ID is enough.
      const qr = `BKG-${bookingId}-S${seat.seat_id}-${randomToken()}`;
      const [t] = await conn.execute<ResultSetHeader>(
        "INSERT INTO Ticket (booking_id, seat_id, event_id, qr_code) VALUES (?, ?, ?, ?)",
        [bookingId, seat.seat_id, event_id, qr],
      );
      ticketIds.push(t.insertId);
    }

    // ─── 8. Insert Payment (UNIQUE on booking_id, so retries are safe) ─────
    const [paymentResult] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Payment (booking_id, amount, payment_method, status)
       VALUES (?, ?, ?, 'Completed')`,
      [bookingId, total, payment_method],
    );

    // ─── 9. Booking_Discount link ───────────────────────────────────────────
    if (discount) {
      await conn.execute<ResultSetHeader>(
        "INSERT INTO Booking_Discount (booking_id, discount_id) VALUES (?, ?)",
        [bookingId, discount.discount_id],
      );
    }

    // ─── 10. Audit row in Transactions ─────────────────────────────────────
    await conn.execute<ResultSetHeader>(
      "INSERT INTO Transactions (booking_id, transaction_type) VALUES (?, 'COMMIT')",
      [bookingId],
    );

    // ─── 11. Drop the now-redundant seat locks ─────────────────────────────
    await deleteLocksWithin(conn, event_id, seat_ids);

    await conn.commit();

    return NextResponse.json(
      {
        data: {
          booking_id: bookingId,
          ticket_ids: ticketIds,
          payment_id: paymentResult.insertId,
          subtotal,
          discount_amount: discountAmt,
          convenience_fee: convFee,
          gst,
          total,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    await conn.rollback();

    // Surface the unique-constraint case as a clean 409. Anything else is 500.
    const message = err instanceof Error ? err.message : "Booking failed";
    if (
      message.includes("uniq_event_seat") ||
      message.includes("Duplicate entry")
    ) {
      return NextResponse.json(
        { error: "Seat was booked by another user" },
        { status: 409 },
      );
    }
    console.error("book-ticket error:", err);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  } finally {
    conn.release();
  }
}

function randomToken(): string {
  // Crypto random base36 — short and unguessable enough for QR payloads.
  // For production, use HMAC over (booking_id, seat_id, secret) so scanners
  // can verify without a DB call.
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
