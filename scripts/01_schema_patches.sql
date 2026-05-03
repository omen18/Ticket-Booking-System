-- ============================================================================
-- Schema patches for ticket_booking_system
-- Run in this order. Each statement is idempotent where MySQL allows.
-- ============================================================================

USE ticket_booking_system;

-- ---------------------------------------------------------------------------
-- 1. Prevent double-booking at the database level.
--    Without this, two concurrent INSERTs into Ticket can both succeed
--    even with FOR UPDATE on a non-existent row (gap locks won't save you
--    because there's no row to lock yet). A unique constraint is bulletproof.
-- ---------------------------------------------------------------------------
ALTER TABLE Ticket
  ADD CONSTRAINT uniq_event_seat UNIQUE (event_id, seat_id);

-- ---------------------------------------------------------------------------
-- 2. Seat_Lock needs uniqueness on (seat_id, event_id) so we can use
--    INSERT ... ON DUPLICATE KEY UPDATE for atomic "claim or refresh" logic.
--    Also: NOT NULL the columns that should never be null.
-- ---------------------------------------------------------------------------
ALTER TABLE Seat_Lock
  MODIFY seat_id     INT NOT NULL,
  MODIFY event_id    INT NOT NULL,
  MODIFY user_id     INT NOT NULL,
  MODIFY expiry_time TIMESTAMP NOT NULL;

ALTER TABLE Seat_Lock
  ADD CONSTRAINT uniq_seat_event UNIQUE (seat_id, event_id);

-- Foreign keys for Seat_Lock (currently missing). On user/seat/event delete,
-- locks should disappear too.
ALTER TABLE Seat_Lock
  ADD CONSTRAINT fk_lock_seat  FOREIGN KEY (seat_id)  REFERENCES Seat(seat_id)   ON DELETE CASCADE,
  ADD CONSTRAINT fk_lock_event FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_lock_user  FOREIGN KEY (user_id)  REFERENCES Users(user_id)  ON DELETE CASCADE;

-- Index for the cleanup query "DELETE FROM Seat_Lock WHERE expiry_time < NOW()"
ALTER TABLE Seat_Lock ADD INDEX idx_expiry (expiry_time);

-- ---------------------------------------------------------------------------
-- 3. Add a role flag to Users so a single Users row can be an admin
--    instead of maintaining a separate Admin table that's keyed on email.
--    This eliminates the "is this email also in Admin?" lookup on every login
--    and lets you grant admin to existing users without recreating accounts.
--
--    Keep Admin table for now (Event.admin_id depends on it) — we'll just
--    sync it. New admin grants go through Users.is_admin.
-- ---------------------------------------------------------------------------
ALTER TABLE Users
  ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0,
  ADD INDEX idx_is_admin (is_admin);

-- Backfill: any existing Admin email that also exists in Users gets is_admin=1
UPDATE Users u
JOIN Admin a ON a.email = u.email
SET u.is_admin = 1;

-- ---------------------------------------------------------------------------
-- 4. Indexes for hot query paths.
--    These are the queries you actually run. Verified against your route files.
-- ---------------------------------------------------------------------------

-- "List bookings for a user, newest first" (profile page, admin dashboard)
ALTER TABLE Booking ADD INDEX idx_user_date (user_id, booking_date DESC);

-- "Find tickets for a booking" (confirmation page, admin bookings join)
-- booking_id already has KEY but a covering index helps the join + seat_id select
ALTER TABLE Ticket ADD INDEX idx_booking_seat (booking_id, seat_id);

-- "Is this seat booked for this event?" — the seat-map query.
-- Already covered by uniq_event_seat above.

-- "Events ordered by date" — events list page
ALTER TABLE Event ADD INDEX idx_event_date (event_date);

-- ---------------------------------------------------------------------------
-- 5. Discount: prevent the same discount being applied twice to one booking
--    (Booking_Discount already has composite PK, so this is just a sanity note.)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 6. Seat: a seat number must be unique within a venue, otherwise you can
--    have two "A1"s in the same hall.
-- ---------------------------------------------------------------------------
ALTER TABLE Seat
  ADD CONSTRAINT uniq_seat_venue UNIQUE (venue_id, seat_number);

-- ---------------------------------------------------------------------------
-- 7. Optional but recommended: add price to Seat (currently the app hardcodes
--    SEAT_PRICE by row letter in code, which means changing prices requires
--    a deploy). Skip if you want to keep the code-side pricing.
-- ---------------------------------------------------------------------------
-- ALTER TABLE Seat ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SHOW INDEX FROM Ticket;
SHOW INDEX FROM Seat_Lock;
SHOW INDEX FROM Users;
