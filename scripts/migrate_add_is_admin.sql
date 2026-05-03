-- Run this once in MySQL to add the is_admin column to Users.
-- The app's login and signup routes depend on this column.
--
-- Step 1: add the column (defaults everyone to 0 = regular user)
ALTER TABLE Users
  ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0;

-- Step 2: promote anyone whose email already appears in the Admin table
UPDATE Users u
  INNER JOIN Admin a ON a.email = u.email
  SET u.is_admin = 1;
