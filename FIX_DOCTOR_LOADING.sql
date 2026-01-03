-- ============================================================================
-- FIX DOCTOR LOADING ISSUE - COMPLETE MIGRATION SCRIPT
-- ============================================================================
-- This script fixes the issue where doctors are not loading in booking pages
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Add missing columns to doctors table
-- ----------------------------------------------------------------------------

-- Add approval column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'approval'
  ) THEN
    ALTER TABLE public.doctors
    ADD COLUMN approval TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval IN ('pending', 'approved', 'rejected'));

    RAISE NOTICE 'Added approval column to doctors table';
  ELSE
    RAISE NOTICE 'approval column already exists';
  END IF;
END $$;

-- Add clinic_name column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'clinic_name'
  ) THEN
    ALTER TABLE public.doctors
    ADD COLUMN clinic_name TEXT;

    RAISE NOTICE 'Added clinic_name column to doctors table';
  ELSE
    RAISE NOTICE 'clinic_name column already exists';
  END IF;
END $$;

-- Add clinic location columns (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'clinic_latitude'
  ) THEN
    ALTER TABLE public.doctors
    ADD COLUMN clinic_latitude DECIMAL(10, 8);

    RAISE NOTICE 'Added clinic_latitude column to doctors table';
  ELSE
    RAISE NOTICE 'clinic_latitude column already exists';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'clinic_longitude'
  ) THEN
    ALTER TABLE public.doctors
    ADD COLUMN clinic_longitude DECIMAL(11, 8);

    RAISE NOTICE 'Added clinic_longitude column to doctors table';
  ELSE
    RAISE NOTICE 'clinic_longitude column already exists';
  END IF;
END $$;


-- Step 2: Create indexes for better performance
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_doctors_location
  ON public.doctors(clinic_latitude, clinic_longitude);

CREATE INDEX IF NOT EXISTS idx_doctors_approval
  ON public.doctors(approval);


-- Step 3: Update existing doctors to have 'approved' status
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.doctors
  SET approval = 'approved'
  WHERE approval IS NULL OR approval = '' OR approval NOT IN ('pending', 'approved', 'rejected');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % existing doctors to approved status', updated_count;
END $$;


-- Step 4: Update RLS policies
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  -- Drop the old restrictive policy
  DROP POLICY IF EXISTS "Anyone can view active doctors" ON public.doctors;

  -- Create a more permissive policy for testing (allows viewing active doctors)
  CREATE POLICY "Anyone can view all active doctors" ON public.doctors
    FOR SELECT USING (is_active = TRUE);

  RAISE NOTICE 'Updated RLS policies successfully';
END $$;


-- Step 5: Verify the setup
-- ----------------------------------------------------------------------------

-- Check if we have doctors
DO $$
DECLARE
  doctor_count INTEGER;
  approved_doctor_count INTEGER;
  doctor_with_availability INTEGER;
BEGIN
  -- Count total active doctors
  SELECT COUNT(*) INTO doctor_count
  FROM public.doctors
  WHERE is_active = TRUE;

  RAISE NOTICE 'Total active doctors: %', doctor_count;

  -- Count approved doctors
  SELECT COUNT(*) INTO approved_doctor_count
  FROM public.doctors
  WHERE is_active = TRUE AND approval = 'approved';

  RAISE NOTICE 'Approved active doctors: %', approved_doctor_count;

  -- Count doctors with availability
  SELECT COUNT(DISTINCT doctor_id) INTO doctor_with_availability
  FROM public.doctor_availability
  WHERE is_active = TRUE AND date >= CURRENT_DATE::TEXT;

  RAISE NOTICE 'Doctors with future availability: %', doctor_with_availability;

  -- Warn if no doctors found
  IF doctor_count = 0 THEN
    RAISE WARNING 'No active doctors found! You may need to run INSERT_SAMPLE_DOCTORS.sql';
  END IF;

  IF doctor_with_availability = 0 THEN
    RAISE WARNING 'No doctors have availability slots! You may need to create availability slots.';
  END IF;
END $$;


-- Step 6: Display current doctors and their availability
-- ----------------------------------------------------------------------------

SELECT
  d.id,
  d.full_name,
  d.email,
  d.specialization,
  d.approval,
  d.is_active,
  d.is_verified,
  d.clinic_name,
  d.clinic_address,
  d.clinic_latitude,
  d.clinic_longitude,
  COUNT(DISTINCT da.id) as availability_slots
FROM public.doctors d
LEFT JOIN public.doctor_availability da
  ON d.id = da.doctor_id
  AND da.is_active = TRUE
  AND da.date >= CURRENT_DATE::TEXT
WHERE d.is_active = TRUE
GROUP BY d.id, d.full_name, d.email, d.specialization, d.approval,
         d.is_active, d.is_verified, d.clinic_name, d.clinic_address,
         d.clinic_latitude, d.clinic_longitude
ORDER BY d.created_at DESC;


-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. If you see "No active doctors found", run INSERT_SAMPLE_DOCTORS.sql
-- 2. If doctors have no availability slots, create them using the Doctor Portal
--    or run QUICK_TEST_DATA.sql to create sample availability
-- 3. Check the application console for detailed logging from:
--    - [getAvailableDoctors]
--    - [HomeConsultBooking]
--    - [OnlineConsultBooking]
-- 4. The logs will show you exactly why doctors might not be appearing
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration complete! Check the output above for your doctor data.';
  RAISE NOTICE '============================================================';
END $$;
