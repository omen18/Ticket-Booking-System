import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";

import { requireAdmin, AuthError } from "@/lib/auth/session";
import db from "@/lib/db";

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  is_admin: number;
  booking_count: number;
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

  const [users] = await db.query<UserRow[]>(
    `SELECT
       u.user_id,
       u.name,
       u.email,
       u.phone,
       u.is_admin,
       COUNT(b.booking_id) AS booking_count
     FROM Users u
     LEFT JOIN Booking b ON b.user_id = u.user_id
     GROUP BY u.user_id, u.name, u.email, u.phone, u.is_admin
     ORDER BY u.user_id ASC`,
  );

  return NextResponse.json({
    data: users.map((u) => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "—",
      is_admin: Number(u.is_admin),
      booking_count: Number(u.booking_count),
    })),
  });
}
