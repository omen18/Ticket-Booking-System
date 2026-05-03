import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import { Discount, Seat } from "@/types";
import { SEAT_PRICE, CONVENIENCE_FEE, GST_RATE } from "@/lib/store/bookingStore";

interface DiscountRow extends RowDataPacket {
  discount_id: number;
  code: string;
  percentage: number;
  expiry_date: string;
}

export async function findDiscountByCode(code: string): Promise<Discount | null> {
  const [rows] = await db.query<DiscountRow[]>(
    "SELECT discount_id, code, percentage, expiry_date FROM Discount WHERE LOWER(code) = LOWER(?) AND expiry_date >= CURDATE() LIMIT 1",
    [code.trim()]
  );
  return rows[0] ?? null;
}

export function calculateSubtotal(selectedSeats: Seat[]) {
  return selectedSeats.reduce((sum, s) => {
    const prefix = s.seat_number[0]?.toUpperCase() ?? "E";
    return sum + (SEAT_PRICE[prefix] ?? 150);
  }, 0);
}

export function calculateTotal(subtotal: number, discount: Discount | null) {
  const convFee = CONVENIENCE_FEE;
  const gst = Math.round(convFee * GST_RATE * 100) / 100;
  const discountAmt = discount ? Math.round((subtotal * discount.percentage) / 100 * 100) / 100 : 0;
  return Math.max(0, subtotal - discountAmt + convFee + gst);
}
