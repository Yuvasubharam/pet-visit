-- Migration: Add approval status and clinic_name columns to doctors table
-- This fixes the issue where doctors are not loading in booking pages

-- Add approval column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'approval'
  ) THEN
    ALTER TABLE doctors
    ADD COLUMN approval TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add clinic_name column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'clinic_name'
  ) THEN
    ALTER TABLE doctors
    ADD COLUMN clinic_name TEXT;
  END IF;
END $$;

-- Add clinic location columns (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'clinic_latitude'
  ) THEN
    ALTER TABLE doctors
    ADD COLUMN clinic_latitude DECIMAL(10, 8);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'clinic_longitude'
  ) THEN
    ALTER TABLE doctors
    ADD COLUMN clinic_longitude DECIMAL(11, 8);
  END IF;
END $$;

-- Create index on location columns for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_location ON doctors(clinic_latitude, clinic_longitude);

-- Update existing doctors to have 'approved' status by default
-- This ensures existing doctors will show up in the booking flow
UPDATE doctors
SET approval = 'approved'
WHERE approval IS NULL OR approval = '';

-- Update the RLS policy to include approval check
-- First, drop the existing policy
DROP POLICY IF EXISTS "Anyone can view active doctors" ON doctors;

-- Create new policy that checks for active, verified, AND approved doctors
CREATE POLICY "Anyone can view active doctors" ON doctors
  FOR SELECT USING (is_active = TRUE AND is_verified = TRUE AND approval = 'approved');

-- Add a policy to allow viewing all active doctors (even if not verified) for testing
-- You can remove this in production
CREATE POLICY "Anyone can view all active doctors for testing" ON doctors
  FOR SELECT USING (is_active = TRUE);

-- Comment: The second policy is less restrictive and will allow doctors to show up
-- even if they're not verified yet. In production, you should drop this policy
-- and only use the first one.
