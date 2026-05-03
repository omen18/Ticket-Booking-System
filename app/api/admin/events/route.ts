// app/api/admin/events/route.ts
import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth/session";
import { adminCreateEventSchema } from "@/lib/validations/admin";

interface EventRow extends RowDataPacket {
  event_id: number;
  event_name: string;
  event_date: string;
  venue_id: number;
  category_id: number;
  organizer_id: number;
  admin_id: number;
}

// Tiny helper so we don't repeat the AuthError handling in every route.
async function authedAdmin() {
  try {
    return { admin: await requireAdmin(), error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        admin: null,
        error: NextResponse.json({ error: err.message }, { status: err.status }),
      };
    }
    throw err;
  }
}

export async function GET() {
  const { admin, error } = await authedAdmin();
  if (error) return error;

  const [rows] = await db.query<EventRow[]>(
    `SELECT event_id, event_name, event_date, venue_id, category_id, organizer_id, admin_id
     FROM Event
     ORDER BY event_date ASC`,
  );
  void admin; // unused but documents that auth ran
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const { admin, error } = await authedAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = adminCreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { event_name, event_date, venue_id, category_id, organizer_id } = parsed.data;

  // The legacy schema requires Event.admin_id to point to the Admin table.
  // We resolve the current user's matching admin row by email.
  const [adminRows] = await db.query<RowDataPacket[]>(
    "SELECT admin_id FROM Admin WHERE email = ? LIMIT 1",
    [admin!.email],
  );
  const adminId = adminRows[0]?.admin_id;
  if (!adminId) {
    return NextResponse.json(
      {
        error:
          "Your user has admin privileges but no matching row in the Admin table. Insert one with the same email.",
      },
      { status: 500 },
    );
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO Event (event_name, event_date, venue_id, category_id, organizer_id, admin_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [event_name, event_date, venue_id, category_id, organizer_id, adminId],
  );

  return NextResponse.json(
    {
      data: {
        event_id: result.insertId,
        event_name,
        event_date,
        venue_id,
        category_id,
        organizer_id,
        admin_id: adminId,
      },
    },
    { status: 201 },
  );
}
