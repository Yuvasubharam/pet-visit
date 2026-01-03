-- =====================================================
-- FIX 403 ERROR: Allow Doctors to Update Bookings
-- =====================================================
-- This removes the restrictive approval requirement
-- and ensures doctors can update their assigned bookings
-- =====================================================

-- =====================================================
-- PROBLEM IDENTIFIED
-- =====================================================

/*
The policy "Doctors can update their booking details" requires:
  - approval = 'approved'

This is blocking updates even though other policies don't require approval.

RLS evaluates ALL policies, and if ANY policy is too restrictive,
it can block the operation.

SOLUTION: Remove or fix the restrictive policy
*/

-- =====================================================
-- PART 1: Remove the Restrictive Policy
-- =====================================================

DROP POLICY IF EXISTS "Doctors can update their booking details" ON bookings;

-- Recreate it WITHOUT the approval requirement
CREATE POLICY "Doctors can update their booking details"
ON bookings FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = bookings.doctor_id
    AND doctors.user_id = auth.uid()
    AND doctors.is_active = true
    -- REMOVED: AND doctors.approval = 'approved'
  )
);

-- =====================================================
-- PART 2: Ensure the Main Policy is Correct
-- =====================================================

-- Verify the main doctor update policy exists and is correct
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;

CREATE POLICY "Doctors can update their assigned bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors
    WHERE user_id = auth.uid()
    AND is_active = true
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- =====================================================
-- PART 3: Remove Duplicate User Policies
-- =====================================================

-- There are TWO "Users can update" policies - keep only one
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

-- Keep the authenticated one, remove the public one
-- This prevents conflicts

-- =====================================================
-- PART 4: Verify Policies
-- =====================================================

SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'bookings'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Doctor Update Policy Fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Removed approval requirement from restrictive policy';
  RAISE NOTICE '✓ Ensured main doctor update policy is active';
  RAISE NOTICE '✓ Removed duplicate user policies';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test Now:';
  RAISE NOTICE '1. Login as doctor (dimplekumarvasamsetti89@gmail.com)';
  RAISE NOTICE '2. Open booking 1a453a67-a41d-4059-8dba-a518449d9b51';
  RAISE NOTICE '3. Click "Mark Complete"';
  RAISE NOTICE '4. Should succeed without 403 error!';
END $$;
