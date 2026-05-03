// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import db from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import {
  setSessionCookie,
  verifyPassword,
  isBcryptHash,
  hashPassword,
} from "@/lib/auth/session";
import { findDevUserByEmail, shouldUseDevAuth } from "@/lib/auth/devAuth";

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  is_admin: number; // tinyint
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (shouldUseDevAuth()) {
    const user = findDevUserByEmail(normalizedEmail);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSessionCookie({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      is_admin: Boolean(user.role === "admin"),
    });

    return NextResponse.json({
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role ?? "user",
      },
    });
  }

  try {
    const [rows] = await db.query<UserRow[]>(
      "SELECT user_id, name, email, phone, password, is_admin FROM `Users` WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );
    const user = rows[0];

    // IMPORTANT: same response for "wrong email" and "wrong password" to prevent
    // email enumeration attacks.
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let ok: boolean;
    if (isBcryptHash(user.password)) {
      ok = await verifyPassword(password, user.password);
    } else {
      // Legacy plaintext path. Accept the comparison once, then upgrade in place.
      ok = password === user.password;
      if (ok) {
        const newHash = await hashPassword(password);
        await db.query<ResultSetHeader>(
          "UPDATE `Users` SET password = ? WHERE user_id = ?",
          [newHash, user.user_id],
        );
      }
    }

    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSessionCookie({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin === 1,
    });

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
    const user = findDevUserByEmail(normalizedEmail);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSessionCookie({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      is_admin: Boolean(user.role === "admin"),
    });

    return NextResponse.json({
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role ?? "user",
      },
    });
  }
}
