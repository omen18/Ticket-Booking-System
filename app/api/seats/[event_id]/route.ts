import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { events as mockEvents } from "@/lib/mock";

interface EventRow extends RowDataPacket { venue_id: number }
interface SeatRow extends RowDataPacket {
  seat_id: number;
  seat_number: string;
  venue_id: number;
  status: string;
}

interface Context {
  params: Promise<{ event_id: string }>;
}

export async function GET(_: Request, { params }: Context) {
  const { event_id } = await params;
  const eventId = Number(event_id);

  if (Number.isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  // Read the session so we can exclude the current user's own locks from the
  // "locked" state — seats they hold should appear selectable to them.
  const session = await getSession();
  const currentUserId = session?.user_id ?? 0;

  try {
    const [eventRows] = await db.query<EventRow[]>(
      "SELECT venue_id FROM Event WHERE event_id = ? LIMIT 1",
      [eventId],
    );

    if (!eventRows[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { venue_id } = eventRows[0];

    // Three-state status per seat:
    //   booked  → already ticketed for this event (permanent)
    //   locked  → held by another user with a non-expired lock (temporary)
    //   available → free to select
    //
    // The current user's own locks are deliberately excluded from "locked" so
    // they can still see (and re-select) seats they hold on this page.
    const [seats] = await db.query<SeatRow[]>(
      `SELECT
         s.seat_id,
         s.seat_number,
         s.venue_id,
         CASE
           WHEN t.ticket_id  IS NOT NULL THEN 'booked'
           WHEN sl.lock_id   IS NOT NULL THEN 'locked'
           ELSE 'available'
         END AS status
       FROM Seat s
       LEFT JOIN Ticket    t  ON  t.seat_id  = s.seat_id
                              AND t.event_id = ?
       LEFT JOIN Seat_Lock sl ON  sl.seat_id  = s.seat_id
                              AND sl.event_id  = ?
                              AND sl.expiry_time > NOW()
                              AND sl.user_id   != ?
       WHERE s.venue_id = ?
       ORDER BY s.seat_number ASC`,
      [eventId, eventId, currentUserId, venue_id],
    );

    return NextResponse.json({
      data: seats.map((s) => ({
        seat_id: s.seat_id,
        seat_number: s.seat_number,
        venue_id: s.venue_id,
        status: s.status,
      })),
    });
  } catch {
    // Graceful fallback when DB is unavailable.
    // Generate a demo seat grid (5 rows × 8 cols = 40 seats) with a realistic
    // mix of available / booked / locked so every state is visible in the UI.
    const mockEvent = mockEvents.find((e) => e.event_id === eventId);
    if (!mockEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const COLS = 15;
    // Deterministic patterns so the grid looks realistic, not random on refresh.
    const BOOKED_IDX = new Set([1, 2, 3, 15, 16, 30, 31, 32, 45, 60, 61, 75, 90, 105]);
    const LOCKED_IDX = new Set([8, 23, 38, 53, 68, 83]);

    const demoSeats = ROWS.flatMap((row, r) =>
      Array.from({ length: COLS }, (_, c) => {
        const idx = r * COLS + c;
        const status: "available" | "booked" | "locked" =
          BOOKED_IDX.has(idx) ? "booked" :
          LOCKED_IDX.has(idx) ? "locked" :
          "available";
        return {
          seat_id: 9000 + idx,
          seat_number: `${row}${c + 1}`,
          venue_id: mockEvent.venue_id,
          status,
        };
      }),
    );

    return NextResponse.json({ data: demoSeats });
  }
}
