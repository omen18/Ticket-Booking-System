# Ticket Booking System

Full-stack booking platform built with Next.js 16 (App Router), TypeScript, MySQL, and Tailwind. Users browse events, hold seats, pay, and get a QR ticket; admins manage events, view analytics, and validate tickets at the gate.

## Stack

- **Frontend**: Next.js App Router, React Server Components, Tailwind, framer-motion + GSAP, Zustand
- **Backend**: Next.js API routes, MySQL via `mysql2/promise`, JWT in httpOnly cookies, bcrypt
- **Validation**: Zod everywhere
- **No NextAuth, no Prisma** — both add weight without paying for it at this scale

## Getting started

```bash
# 1. Install deps
npm install

# 2. Configure DB
cp .env.example .env.local
# Edit DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# Generate AUTH_SECRET with: openssl rand -base64 32

# 3. Apply schema patches (assumes you already have ticket_booking_system DB)
mysql -u root -p ticket_booking_system < scripts/01_schema_patches.sql

# 4. Seed an admin user
mysql -u root -p ticket_booking_system <<'SQL'
  -- Replace with your email + a bcrypt hash of your password
  INSERT INTO Users (name, email, phone, password, is_admin)
  VALUES ('Your Name', 'you@example.com', '9000000000', '<bcrypt-hash>', 1);

  -- And a matching Admin row (Event.admin_id requires it)
  INSERT INTO Admin (name, email) VALUES ('Your Name', 'you@example.com');
SQL

# Or just sign up via /auth/register, then:
# UPDATE Users SET is_admin = 1 WHERE email = 'you@example.com';
# INSERT INTO Admin (name, email) SELECT name, email FROM Users WHERE email = 'you@example.com';

# 5. Run dev server
npm run dev
```

## Architecture decisions

### Auth: JWT in an httpOnly cookie

About 150 lines in `lib/auth/session.ts`. Login signs a HS256 JWT containing `{ user_id, email, name, is_admin }` and sets it as `Set-Cookie: session=...; HttpOnly; SameSite=Lax; Secure`. Server-side helpers `getSession()`, `requireUser()`, `requireAdmin()` read and verify it. Client never sees the token.

**Why not NextAuth?** This app doesn't need OAuth providers, account linking, or edge middleware. NextAuth would add 4 dependencies, a database adapter, and a learning tax for callbacks/events. The 150 lines do exactly what's needed.

**Plaintext password migration**: legacy seed data stored plaintext passwords. The login route detects bcrypt vs. plaintext (`isBcryptHash` regex) and auto-upgrades on successful login. Zero downtime.

### Booking: one transaction, server-computed price

The original flow made 4 sequential POSTs (`/booking` → `/ticket` × N → `/payment` → `/booking-discount`) from the client. If any one failed mid-flight, the system was inconsistent. Worse, the client computed and sent the `amount` — meaning a malicious client could pay ₹1 for a ₹500 seat.

The new `/api/book-ticket` route:

1. Verifies the user owns active locks on every requested seat
2. Looks up seat numbers and computes price *server-side* from `SEAT_PRICE` config
3. Validates the discount code against the DB
4. Inserts Booking → Tickets → Payment → Booking_Discount → Transactions log → deletes locks
5. All in **one** transaction; `ROLLBACK` on any failure
6. Returns a 409 if anything conflicts so the client can recover gracefully

### Seat locks: atomic acquire with `INSERT ... ON DUPLICATE KEY UPDATE`

`lib/services/seatLock.ts`. The 10-minute "seat hold" countdown the user sees is now backed by real server-side state in the `Seat_Lock` table, with `UNIQUE(seat_id, event_id)` enforcing one lock per seat. Acquisition:

1. Begin transaction
2. Sweep expired locks for these seats
3. `SELECT ... FOR UPDATE` to inspect remaining locks; reject if any belong to another user
4. Reject if a `Ticket` already exists for these seats (someone completed booking while we were unlocked)
5. `INSERT ... ON DUPLICATE KEY UPDATE` to claim or refresh
6. Commit

If two users race for the same seat, only one wins — the other gets a 409 with a list of conflicts. Verified with the load test below.

### Schema patches that prevent entire bug classes

In `scripts/01_schema_patches.sql`:

- `UNIQUE(event_id, seat_id)` on `Ticket` — the actual double-booking guard. `FOR UPDATE` on a non-existent row provides no protection; only a unique constraint does.
- `UNIQUE(seat_id, event_id)` on `Seat_Lock` — enables atomic upsert for the lock service
- `is_admin` flag on `Users` — replaces the spoofable `x-admin-email` header
- Indexes on `Booking(user_id, booking_date)`, `Event(event_date)`, `Ticket(booking_id, seat_id)`, `Seat_Lock(expiry_time)` — match every hot query path

### Real-time-ish seat map without WebSockets

The seat picker polls `/api/seats/[event_id]` every 8 seconds while the user is making a selection. Cheap, simple, and avoids the WebSocket infrastructure tax for a UX win that's indistinguishable to the user. If you ever need true real-time, swap the `setInterval` for a Server-Sent Events stream.

## Polish features

### Search + filters on the events page
Server-supported filters via `getEvents({ search, category_id, city, ... })`. The page-level UI uses client-side filtering for instant feedback against the already-loaded list. Combined search across event names, venues, organisers, locations.

### Analytics dashboard (`/admin/analytics`)

`/api/admin/analytics` runs 6 aggregation queries in parallel (revenue rolled up to KPIs / by event / by category / by payment method / 30-day daily trend / top occupancy). UI renders an SVG line chart for daily revenue plus bar charts for the rest — no chart library dependency.

All revenue is keyed off `Payment.status = 'Completed'`, never the booking row alone, so abandoned bookings don't pollute the numbers.

### QR ticket validation (`/admin/scanner`)

Two-step UX: paste a QR code, click **Inspect** to see ticket details (event, seat, holder, payment status), then **Check In** to mark it used. Check-ins are recorded in `Transaction_Log` with `action_type = 'CHECKIN-{ticket_id}'` so re-scans correctly identify already-used tickets.

For a real venue, swap the paste input for a USB barcode reader (which presents itself as a keyboard — the input field already accepts that), or wire up a camera library like `html5-qrcode`.

## Load test: proving concurrency safety

```bash
# In one terminal
npm run dev

# In another
EVENT_ID=1 SEAT_ID=1 CONCURRENT=25 node scripts/load-test-booking.mjs
```

Spins up 25 test users in parallel, each attempting to book seat 1 for event 1 at the same instant. Reports pass/fail. With the unique constraint and seat lock service in place, exactly one wins.

```
────────── Results ──────────
Total time:       312ms
Successes (201):  1
Conflicts (409):  24
Lock rejections:  0
Other:            0
──────────────────────────────
✅ PASS: Exactly one booking succeeded — concurrency is safe.
```

Run with `FULL_FLOW=1` to test the lock service path; without it, the test goes directly at `/api/book-ticket` and stresses the unique constraint.

## File layout

```
app/
  (app)/                   group with shared navbar/footer
    admin/
      page.tsx             event list + create form + bookings table
      analytics/page.tsx   charts + KPIs
      scanner/page.tsx     QR check-in
      layout.tsx           tab nav + admin guard
    booking/[event_id]/
      BookingClient.tsx    seat picker → review → payment
    confirmation/[booking_id]/page.tsx
    events/                listing + detail
    profile/               bookings, reviews, settings
  api/
    auth/{login,signup,logout,me}/route.ts
    admin/{events,bookings,lookups,analytics,validate-ticket}/route.ts
    book-ticket/route.ts                 atomic booking
    seats/{[event_id],lock}/route.ts     seat map + holds
    events/[id]/route.ts
    profile/[user_id]/...
    review, discount, confirmation
lib/
  auth/session.ts          JWT, bcrypt, requireUser, requireAdmin
  services/seatLock.ts     acquire/release/validate locks
  queries/                 read-only DB queries (events, user, payment, booking)
  store/                   Zustand stores (user, booking)
  validations/             Zod schemas
  hooks/                   useBookingFlow, useSeatMap
  utils/                   formatDate, formatPrice, cn, generateQR
  db.ts                    mysql2 connection pool
components/
  payment/PaymentStep.tsx  card form, OTP modal, atomic submit
  confirmation/Ticket3D.tsx
  layout/, ui/, shared/
scripts/
  01_schema_patches.sql    run this once
  load-test-booking.mjs    concurrency proof
```

## What I'd add next (and what I deliberately didn't)

**Would add:**
- `Ticket.used_at` timestamp column. Currently we look up check-ins via `Transaction_Log` because we couldn't alter the schema beyond what's listed. With control of the schema this would be one column and one query.
- Signed QR codes (HMAC over `booking_id|seat_id|secret`) so scanners can verify offline without a DB hit.
- Refund flow + Payment.refunded_at.
- Per-event seat pricing in DB (currently `SEAT_PRICE` is a config map).
- Rate limiting on `/api/auth/login` and `/api/seats/lock`.

**Wouldn't add for this scale:**
- WebSockets for the seat map. Polling is cheaper and the UX is the same.
- A separate "service layer" between API routes and queries. The `lib/queries/` folder already serves that role.
- Redis for the seat lock. MySQL row-level locks are fine for thousands of concurrent users; only switch when you have evidence of contention.
