import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { getUserById } from "@/lib/queries/user";

interface Context {
  params: Promise<{ user_id: string }>;
}

export async function GET(_: Request, { params }: Context) {
  const { user_id } = await params;
  const userId = Number(user_id);

  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const data = await getUserById(userId);
  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

const patchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(8).optional(),
});

export async function PATCH(request: Request, { params }: Context) {
  const { user_id } = await params;
  const userId = Number(user_id);

  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone } = parsed.data;
  if (!name && !phone) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (name) { fields.push("name = ?"); values.push(name); }
  if (phone) { fields.push("phone = ?"); values.push(phone); }
  values.push(userId);

  await db.query(`UPDATE Users SET ${fields.join(", ")} WHERE user_id = ?`, values);

  const updated = await getUserById(userId);
  return NextResponse.json({ data: updated });
}
