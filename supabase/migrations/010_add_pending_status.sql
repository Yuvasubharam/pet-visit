-- Migration: Add 'pending' status to bookings table
-- This allows bookings to have a pending state while waiting for doctor approval

-- Drop the existing check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new check constraint with 'pending' status included
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'upcoming', 'completed', 'cancelled'));

-- Update the status default to remain 'upcoming' for backward compatibility
-- (bookings without doctor assignment will still be 'upcoming' by default)
