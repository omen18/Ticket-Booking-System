import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

export async function getUserById(userId: number) {
  const [rows] = await db.query<UserRow[]>(
    "SELECT user_id, name, email, phone FROM Users WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const [rows] = await db.query<UserRow[]>(
    "SELECT user_id, name, email, phone FROM Users WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );
  return rows[0] ?? null;
}
