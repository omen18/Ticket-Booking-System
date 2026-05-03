import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth/session";
import {
  acquireLocks,
  releaseLocks,
  HOLD_SECONDS,
} from "@/lib/services/seatLock";

const lockSchema = z.object({
  event_id: z.number().int().positive(),
  seat_ids: z.array(z.number().int().positive()).min(1).max(6),
});

const IS_DEV = process.env.NODE_ENV !== "production";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    const parsed = lockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { event_id, seat_ids } = parsed.data;

    let result: Awaited<ReturnType<typeof acquireLocks>>;
    try {
      result = await acquireLocks(session.user_id, event_id, seat_ids);
    } catch (dbErr) {
      if (!IS_DEV) throw dbErr;
      // Dev fallback: DB unavailable — simulate a successful lock so the full
      // booking flow can be tested without a database connection.
      console.warn("[dev] seat lock DB unavailable, using mock lock:", dbErr instanceof Error ? dbErr.message : dbErr);
      return NextResponse.json({
        data: {
          held: seat_ids,
          expires_in_seconds: HOLD_SECONDS,
          expires_at: new Date(Date.now() + HOLD_SECONDS * 1000).toISOString(),
          dev_mode: true,
        },
      });
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Some seats are no longer available",
          conflicts: result.conflicts,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      data: {
        held: seat_ids,
        expires_in_seconds: HOLD_SECONDS,
        expires_at: new Date(Date.now() + HOLD_SECONDS * 1000).toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[seat lock] unexpected error:", err);
    return NextResponse.json({ error: "Lock failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    const parsed = lockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    try {
      await releaseLocks(session.user_id, parsed.data.event_id, parsed.data.seat_ids);
    } catch (dbErr) {
      if (!IS_DEV) throw dbErr;
      // Dev fallback: silently succeed when DB is unavailable.
      console.warn("[dev] seat release DB unavailable, ignoring:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[seat release] unexpected error:", err);
    return NextResponse.json({ error: "Release failed" }, { status: 500 });
  }
}
