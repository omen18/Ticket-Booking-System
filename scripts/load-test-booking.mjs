/**
 * Concurrent booking load test.
 *
 * Run with: node scripts/load-test-booking.mjs
 *
 * Fires N concurrent POST requests at /api/book-ticket attempting to book the
 * SAME seat for the same event. With proper transaction + unique-constraint
 * handling, exactly one request must succeed (201), and all others must fail
 * with 409. If two or more succeed, your seat-locking is broken.
 *
 * Setup:
 *   - Server running at BASE_URL
 *   - At least one event with available seats
 *   - 50 test users, all with the same password ('testpass'), pre-locked the
 *     same seat (or all skip locks; this test deliberately bypasses the lock
 *     step to stress-test only the book-ticket endpoint's concurrency safety)
 *
 * For a more realistic test, use the FULL_FLOW mode which acquires locks
 * per-user before booking — this tests the lock service.
 */

import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EVENT_ID = Number(process.env.EVENT_ID ?? 1);
const SEAT_ID = Number(process.env.SEAT_ID ?? 1);
const CONCURRENT = Number(process.env.CONCURRENT ?? 25);
const FULL_FLOW = process.env.FULL_FLOW === "1";

// Test users created via /api/auth/signup. Adjust as needed or seed your DB.
const TEST_USER_EMAILS = Array.from({ length: CONCURRENT }, (_, i) =>
  `loadtest_user${i}@example.com`,
);
const TEST_PASSWORD = "loadtest123";

async function login(email) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  // Return the Set-Cookie value so we can re-use it in subsequent requests
  const cookie = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")].filter(Boolean);
  return cookie.join("; ");
}

async function bookTicket(cookie, eventId, seatId) {
  const res = await fetch(`${BASE_URL}/api/book-ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      event_id: eventId,
      seat_ids: [seatId],
      payment_method: "UPI",
    }),
  });
  return { status: res.status, body: await res.json() };
}

async function acquireLock(cookie, eventId, seatId) {
  const res = await fetch(`${BASE_URL}/api/seats/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ event_id: eventId, seat_ids: [seatId] }),
  });
  return { status: res.status, body: await res.json() };
}

async function ensureSignup(email) {
  await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: email.split("@")[0],
      email,
      phone: "9000000000",
      password: TEST_PASSWORD,
    }),
  });
  // Ignore 409 (already exists) — the login below will validate.
}

async function main() {
  console.log(`Concurrent booking test: ${CONCURRENT} workers attempting to book seat ${SEAT_ID} on event ${EVENT_ID}`);
  console.log(`Mode: ${FULL_FLOW ? "FULL (lock + book)" : "DIRECT (skip lock; tests Ticket unique constraint)"}`);

  // Sign up + log in all test users in parallel
  console.log("Signing up + logging in test users...");
  await Promise.all(TEST_USER_EMAILS.map(ensureSignup));
  const cookies = await Promise.all(TEST_USER_EMAILS.map(login));

  // Small jitter so all requests don't fire on the exact same tick
  // (simulates real-world client timing)
  console.log("Firing concurrent booking attempts...");
  const start = Date.now();
  const results = await Promise.all(
    cookies.map(async (cookie, i) => {
      await sleep(Math.random() * 50);

      if (FULL_FLOW) {
        const lock = await acquireLock(cookie, EVENT_ID, SEAT_ID);
        if (lock.status !== 200) {
          return { worker: i, phase: "lock", status: lock.status, body: lock.body };
        }
      }

      const book = await bookTicket(cookie, EVENT_ID, SEAT_ID);
      return { worker: i, phase: "book", status: book.status, body: book.body };
    }),
  );
  const elapsed = Date.now() - start;

  // Report
  const successes = results.filter((r) => r.phase === "book" && r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const lockFails = results.filter((r) => r.phase === "lock" && r.status !== 200);
  const other = results.filter((r) =>
    !(r.phase === "book" && r.status === 201) &&
    r.status !== 409 &&
    !(r.phase === "lock" && r.status !== 200),
  );

  console.log("\n────────── Results ──────────");
  console.log(`Total time:       ${elapsed}ms`);
  console.log(`Successes (201):  ${successes.length}`);
  console.log(`Conflicts (409):  ${conflicts.length}`);
  console.log(`Lock rejections:  ${lockFails.length}`);
  console.log(`Other:            ${other.length}`);
  console.log("──────────────────────────────");

  if (other.length > 0) {
    console.log("\nUnexpected responses:");
    other.forEach((r) => console.log(`  worker=${r.worker} phase=${r.phase} status=${r.status}`, r.body));
  }

  if (successes.length === 1) {
    console.log("\n✅ PASS: Exactly one booking succeeded — concurrency is safe.");
    console.log(`   Winner: worker=${successes[0].worker} → booking_id=${successes[0].body.data?.booking_id}`);
    process.exit(0);
  } else if (successes.length === 0) {
    console.log("\n⚠️  No bookings succeeded. Something may be misconfigured (event/seat IDs?).");
    process.exit(2);
  } else {
    console.log(`\n❌ FAIL: ${successes.length} bookings succeeded for the same seat. DOUBLE BOOKING IS POSSIBLE.`);
    successes.forEach((r) =>
      console.log(`   worker=${r.worker} → booking_id=${r.body.data?.booking_id}`),
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(2);
});
