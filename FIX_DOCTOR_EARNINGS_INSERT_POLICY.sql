-- =====================================================
-- FIX: Add INSERT policy for doctor_earnings
-- =====================================================
-- The doctor_earnings table has RLS enabled but no INSERT policy
-- This prevents doctors from creating earning records when marking
-- consultations as complete.

-- Step 1: Check current policies on doctor_earnings
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'doctor_earnings'
ORDER BY cmd, policyname;

-- Step 2: Drop the old INSERT policy if it exists
DROP POLICY IF EXISTS "Doctors can insert own earnings" ON doctor_earnings;

-- Step 3: Add INSERT policy for doctors to create their own earnings
-- This allows doctors to insert earnings records for their own consultations
CREATE POLICY "Doctors can insert own earnings"
ON doctor_earnings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if the authenticated user is the doctor for this earning record
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = doctor_earnings.doctor_id
    AND doctors.user_id = auth.uid()
    AND doctors.is_active = true
  )
);

-- Step 3: Verify the new policy was created
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'doctor_earnings'
ORDER BY cmd, policyname;

-- Step 4: Test if the policy would allow insertion
-- Run this while logged in as the doctor
SELECT
  d.id as doctor_id,
  d.user_id as doctor_user_id,
  auth.uid() as current_user_id,
  d.is_active,
  CASE
    WHEN d.user_id = auth.uid() AND d.is_active = true
    THEN '✅ CAN insert earnings'
    ELSE '❌ CANNOT insert earnings'
  END as can_insert
FROM doctors d
WHERE d.id = 'bac55b1b-b1f1-40b4-8ef3-bca09465a7f2';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Doctor Earnings INSERT Policy Added!';
  RAISE NOTICE '';
  RAISE NOTICE 'Doctors can now:';
  RAISE NOTICE '1. ✓ View their own earnings (existing)';
  RAISE NOTICE '2. ✓ Insert new earning records (NEW!)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test now:';
  RAISE NOTICE '1. Refresh your doctor dashboard';
  RAISE NOTICE '2. Open a consultation';
  RAISE NOTICE '3. Click "Mark Complete"';
  RAISE NOTICE '4. Should now work without RLS error!';
END $$;
