import { NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2/promise";

import { requireAdmin, AuthError } from "@/lib/auth/session";
import db from "@/lib/db";

interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM Event WHERE event_id = ?",
      [eventId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { event_id: eventId, deleted: true } });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Event cannot be deleted because linked bookings exist" },
      { status: 409 },
    );
  }
}
