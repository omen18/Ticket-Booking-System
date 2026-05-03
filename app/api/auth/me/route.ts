// app/api/auth/me/route.ts
//
// The client calls this once on app load to learn who (if anyone) is signed in,
// since httpOnly cookies are invisible to JS. Hydrate Zustand from this.

import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { findDevUserById, shouldUseDevAuth } from "@/lib/auth/devAuth";

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  is_admin: number;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ data: null });
  }

  if (shouldUseDevAuth()) {
    const user = findDevUserById(session.user_id);
    return NextResponse.json({
      data: {
        user_id: session.user_id,
        name: user?.name ?? session.name,
        email: user?.email ?? session.email,
        phone: user?.phone ?? "",
        role: session.is_admin ? "admin" : "user",
      },
    });
  }

  // Re-fetch from DB so revoked admin status / name changes are reflected.
  // If you want to skip this DB hit, return the JWT payload directly — the
  // tradeoff is that the cookie can be stale for up to 7 days.
  try {
    const [rows] = await db.query<UserRow[]>(
      "SELECT user_id, name, email, phone, is_admin FROM `Users` WHERE user_id = ? LIMIT 1",
      [session.user_id],
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.is_admin === 1 ? "admin" : "user",
      },
    });
  } catch {
    const user = findDevUserById(session.user_id);
    return NextResponse.json({
      data: {
        user_id: session.user_id,
        name: user?.name ?? session.name,
        email: user?.email ?? session.email,
        phone: user?.phone ?? "",
        role: session.is_admin ? "admin" : "user",
      },
    });
  }
}
