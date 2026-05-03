// lib/services/seatLock.ts
//
// Server-side seat holds. The booking flow looks like this:
//
//   1. User picks seats → POST /api/seats/lock          (this file)
//   2. User confirms payment → POST /api/book-ticket    (atomic: see book-ticket route)
//   3. On expiry/cancel → POST /api/seats/release       (this file)
//
// Atomicity rules:
// - Lock acquisition must be all-or-nothing for the seat group. If any one of
//   the requested seats can't be locked, none are locked.
// - Locks expire automatically — we don't need a cron; we just treat any lock
//   with expiry_time < NOW() as not-existing during acquire.
// - The book-ticket route validates that each seat is locked by THIS user
//   before inserting tickets, then deletes the locks in the same transaction.

import type { PoolConnection } from "mysql2/promise";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";

export const HOLD_SECONDS = 600; // 10 minutes — must match UI countdown

interface LockRow extends RowDataPacket {
  lock_id: number;
  seat_id: number;
  user_id: number;
  expiry_time: Date;
}

/**
 * Try to lock a set of seats for a user. Returns { ok: true } if all seats
 * were locked (or already held by this same user, in which case we extend),
 * { ok: false, conflicts } if any seat is held by someone else.
 *
 * Implementation: a single transaction that
 *   a) deletes expired locks for these seats
 *   b) checks no remaining lock is owned by another user
 *   c) upserts locks for our user with a fresh expiry
 *
 * Why not INSERT IGNORE: we want to refresh expiry on re-acquisition by the
 * same user (so a refresh doesn't shorten the hold).
 */
export async function acquireLocks(
  userId: number,
  eventId: number,
  seatIds: number[],
): Promise<{ ok: true } | { ok: false; conflicts: number[] }> {
  if (seatIds.length === 0) return { ok: true };

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const placeholders = seatIds.map(() => "?").join(",");

    // (a) Sweep expired locks for these seats. Cheap and keeps the table small.
    await conn.execute<ResultSetHeader>(
      `DELETE FROM Seat_Lock
       WHERE event_id = ? AND seat_id IN (${placeholders}) AND expiry_time < NOW()`,
      [eventId, ...seatIds],
    );

    // (b) Lock the rows we're about to look at to prevent two requests racing
    //     on the same seat. SELECT ... FOR UPDATE on the existing rows.
    const [held] = await conn.execute<LockRow[]>(
      `SELECT lock_id, seat_id, user_id, expiry_time
       FROM Seat_Lock
       WHERE event_id = ? AND seat_id IN (${placeholders})
       FOR UPDATE`,
      [eventId, ...seatIds],
    );

    const conflicts = held
      .filter((l) => l.user_id !== userId)
      .map((l) => l.seat_id);

    if (conflicts.length > 0) {
      await conn.rollback();
      return { ok: false, conflicts };
    }

    // (c) Also reject if a seat is already ticketed (someone completed booking
    //     while these were unlocked).
    const [taken] = await conn.execute<RowDataPacket[]>(
      `SELECT seat_id FROM Ticket
       WHERE event_id = ? AND seat_id IN (${placeholders})`,
      [eventId, ...seatIds],
    );
    if (taken.length > 0) {
      await conn.rollback();
      return { ok: false, conflicts: taken.map((r) => r.seat_id as number) };
    }

    // (d) Upsert: insert a fresh lock for each seat, or refresh expiry if this
    //     user already had it.
    //     The unique key (seat_id, event_id) makes this atomic.
    const expiry = new Date(Date.now() + HOLD_SECONDS * 1000);
    for (const seatId of seatIds) {
      await conn.execute<ResultSetHeader>(
        `INSERT INTO Seat_Lock (seat_id, event_id, user_id, expiry_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           user_id = VALUES(user_id),
           expiry_time = VALUES(expiry_time)`,
        [seatId, eventId, userId, expiry],
      );
    }

    await conn.commit();
    return { ok: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Release locks held by a user. Does NOT release locks held by other users.
 * Called when the user navigates away, cancels, or after expiry on the client.
 */
export async function releaseLocks(
  userId: number,
  eventId: number,
  seatIds: number[],
): Promise<void> {
  if (seatIds.length === 0) return;
  const placeholders = seatIds.map(() => "?").join(",");
  await db.query<ResultSetHeader>(
    `DELETE FROM Seat_Lock
     WHERE user_id = ? AND event_id = ? AND seat_id IN (${placeholders})`,
    [userId, eventId, ...seatIds],
  );
}

/**
 * Used by the book-ticket transaction. Verifies every seat is currently
 * locked by this user with a non-expired lock. Must be called inside a
 * transaction with FOR UPDATE so the locks can't disappear between check
 * and ticket insert.
 *
 * Returns the seat_ids that pass. The caller compares to its expected set
 * and rolls back if there's a mismatch.
 */
export async function assertLocksValidWithin(
  conn: PoolConnection,
  userId: number,
  eventId: number,
  seatIds: number[],
): Promise<number[]> {
  if (seatIds.length === 0) return [];
  const placeholders = seatIds.map(() => "?").join(",");
  const [rows] = await conn.execute<LockRow[]>(
    `SELECT seat_id, user_id, expiry_time
     FROM Seat_Lock
     WHERE event_id = ? AND seat_id IN (${placeholders})
     FOR UPDATE`,
    [eventId, ...seatIds],
  );

  const valid = rows
    .filter((r) => r.user_id === userId && r.expiry_time.getTime() > Date.now())
    .map((r) => r.seat_id);

  return valid;
}

/**
 * Delete locks inside an existing transaction (called from book-ticket after
 * tickets are inserted).
 */
export async function deleteLocksWithin(
  conn: PoolConnection,
  eventId: number,
  seatIds: number[],
): Promise<void> {
  if (seatIds.length === 0) return;
  const placeholders = seatIds.map(() => "?").join(",");
  await conn.execute<ResultSetHeader>(
    `DELETE FROM Seat_Lock WHERE event_id = ? AND seat_id IN (${placeholders})`,
    [eventId, ...seatIds],
  );
}
