-- Run this once in MySQL.
-- Adds a UNIQUE constraint on Seat_Lock(seat_id, event_id) so that the
-- ON DUPLICATE KEY UPDATE in acquireLocks() works correctly and prevents
-- duplicate lock rows from accumulating.

-- Step 1: Remove any stale/expired locks first (safe to delete).
DELETE FROM Seat_Lock WHERE expiry_time < NOW();

-- Step 2: If any duplicate (seat_id, event_id) pairs remain, keep only the
-- most-recent lock per pair (highest lock_id = most recently inserted).
DELETE sl1
FROM Seat_Lock sl1
INNER JOIN Seat_Lock sl2
  ON  sl1.seat_id  = sl2.seat_id
  AND sl1.event_id = sl2.event_id
  AND sl1.lock_id  < sl2.lock_id;

-- Step 3: Add the unique key the ON DUPLICATE KEY UPDATE depends on.
ALTER TABLE Seat_Lock
  ADD UNIQUE KEY uniq_seat_event (seat_id, event_id);
