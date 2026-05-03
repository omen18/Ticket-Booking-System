import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";

import { requireAdmin, AuthError } from "@/lib/auth/session";
import db from "@/lib/db";

interface VenueRow extends RowDataPacket {
  venue_id: number;
  venue_name: string;
}

interface CategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
}

interface OrganizerRow extends RowDataPacket {
  organizer_id: number;
  name: string;
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

  const [venues, categories, organizers] = await Promise.all([
    db.query<VenueRow[]>("SELECT venue_id, venue_name FROM Venue ORDER BY venue_name ASC"),
    db.query<CategoryRow[]>("SELECT category_id, category_name FROM Category ORDER BY category_name ASC"),
    db.query<OrganizerRow[]>("SELECT organizer_id, name FROM Organizer ORDER BY name ASC"),
  ]);

  return NextResponse.json({
    data: {
      venues: venues[0],
      categories: categories[0],
      organizers: organizers[0],
    },
  });
}
