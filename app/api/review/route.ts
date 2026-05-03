import { NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import db from "@/lib/db";

interface ReviewRow extends RowDataPacket {
  review_id: number;
  user_id: number;
  event_id: number;
  rating: number;
  comment: string;
  user_name: string;
}

const reviewSchema = z.object({
  user_id: z.number().int().positive(),
  event_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(255),
});

export async function GET() {
  const [rows] = await db.query<ReviewRow[]>(
    `SELECT r.review_id, r.user_id, r.event_id, r.rating, r.comment, u.name AS user_name
     FROM Review r
     JOIN Users u ON u.user_id = r.user_id
     ORDER BY r.review_id DESC`
  );

  const data = rows.map((r) => ({
    review_id: r.review_id,
    user_id: r.user_id,
    event_id: r.event_id,
    rating: r.rating,
    comment: r.comment,
    user: { name: r.user_name },
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { user_id, event_id, rating, comment } = parsed.data;

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO Review (user_id, event_id, rating, comment) VALUES (?, ?, ?, ?)",
      [user_id, event_id, rating, comment]
    );

    return NextResponse.json(
      { data: { review_id: result.insertId, user_id, event_id, rating, comment } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
