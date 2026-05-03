import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";

interface DiscountRow extends RowDataPacket {
  discount_id: number;
  code: string;
  percentage: number;
  expiry_date: string;
}

export async function GET() {
  const [rows] = await db.query<DiscountRow[]>(
    "SELECT discount_id, code, percentage, expiry_date FROM Discount WHERE expiry_date >= CURDATE()"
  );
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const [rows] = await db.query<DiscountRow[]>(
      "SELECT discount_id, code, percentage, expiry_date FROM Discount WHERE LOWER(code) = LOWER(?) AND expiry_date >= CURDATE() LIMIT 1",
      [code.trim()]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
