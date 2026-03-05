-- ================================================================
-- Fix Phone Column Constraint
-- Make phone column nullable and remove NOT NULL constraint
-- This allows OAuth users without phone numbers to be created
-- ================================================================

-- First, update all empty string phone numbers to NULL
UPDATE users SET phone = NULL WHERE phone = '';

-- Remove the NOT NULL constraint from the phone column
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Optionally, you can also drop the unique constraint on phone if you want multiple users to have NULL phone
-- (NULL values don't violate unique constraints in PostgreSQL)
-- If you want to keep the unique constraint (recommended), leave it as is.
-- The unique constraint will allow multiple NULL values but ensure non-NULL values are unique.

-- Verify the changes
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'phone';
