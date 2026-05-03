// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import { signupSchema } from "@/lib/validations/auth";
import { hashPassword, setSessionCookie } from "@/lib/auth/session";
import { createDevUser, findDevUserByEmail, shouldUseDevAuth } from "@/lib/auth/devAuth";
// createDevUser / findDevUserByEmail used only in the shouldUseDevAuth() branch

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    // Return the first field-level error with the field name so the UI can show it clearly
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstField = Object.keys(fieldErrors)[0];
    const firstMsg = fieldErrors[firstField as keyof typeof fieldErrors]?.[0] ?? "Invalid input";
    return NextResponse.json(
      { error: firstMsg, field: firstField },
      { status: 400 },
    );
  }

  const { name, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // ── Dev/offline path (no DB configured) ────────────────────────────────────
  if (shouldUseDevAuth()) {
    const existing = findDevUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: "Email already registered. Please sign in." }, { status: 409 });
    }

    const user = createDevUser({ name, email: normalizedEmail, phone, password });
    await setSessionCookie({ user_id: user.user_id, email: user.email, name: user.name, is_admin: false });

    return NextResponse.json(
      { data: { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: "user" } },
      { status: 201 },
    );
  }

  // ── DB path ─────────────────────────────────────────────────────────────────
  try {
    // 1. Check email uniqueness
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT user_id FROM `Users` WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in instead.", field: "email" },
        { status: 409 },
      );
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Insert user
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO `Users` (name, email, phone, password, is_admin) VALUES (?, ?, ?, ?, 0)",
      [name.trim(), normalizedEmail, phone, passwordHash],
    );

    // 4. Set session cookie so they're immediately logged in
    await setSessionCookie({
      user_id: result.insertId,
      email: normalizedEmail,
      name: name.trim(),
      is_admin: false,
    });

    return NextResponse.json(
      {
        data: {
          user_id: result.insertId,
          name: name.trim(),
          email: normalizedEmail,
          phone,
          role: "user",
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // MySQL duplicate-entry error code 1062 — catch the race condition where
    // two requests slip through the uniqueness check simultaneously.
    if (msg.includes("Duplicate entry") || msg.includes("ER_DUP_ENTRY")) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in instead.", field: "email" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
