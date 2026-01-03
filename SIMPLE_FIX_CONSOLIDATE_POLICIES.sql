-- =====================================================
-- SIMPLE FIX: Consolidate All UPDATE Policies
-- =====================================================
-- This removes ALL existing UPDATE policies and creates
-- ONE simple, clear policy that allows:
-- 1. Users to update their own bookings
-- 2. Doctors to update bookings assigned to them
-- =====================================================

-- =====================================================
-- STEP 1: Remove ALL Existing UPDATE Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can update their booking details" ON bookings;
DROP POLICY IF EXISTS "Doctors can accept unassigned bookings" ON bookings;

-- =====================================================
-- STEP 2: Create ONE Unified UPDATE Policy
-- =====================================================

CREATE POLICY "Allow booking updates by owners and doctors"
ON bookings FOR UPDATE
TO authenticated
USING (
  -- Allow if user owns the booking
  auth.uid() = user_id
  OR
  -- Allow if doctor is assigned to the booking
  doctor_id IN (
    SELECT id FROM doctors
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  -- Allow doctors to accept unassigned consultations
  (
    doctor_id IS NULL
    AND service_type = 'consultation'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
)
WITH CHECK (
  -- After update, must still be owned by user OR assigned to doctor
  auth.uid() = user_id
  OR
  doctor_id IN (
    SELECT id FROM doctors
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- =====================================================
-- STEP 3: Verify the New Policy
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
  RAISE NOTICE '✅ Booking UPDATE Policies Consolidated!';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Removed all conflicting UPDATE policies';
  RAISE NOTICE '✓ Created one unified policy that allows:';
  RAISE NOTICE '  - Users to update their own bookings';
  RAISE NOTICE '  - Doctors to update assigned bookings';
  RAISE NOTICE '  - Doctors to accept unassigned consultations';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test Now:';
  RAISE NOTICE '1. Refresh your doctor dashboard';
  RAISE NOTICE '2. Open the consultation';
  RAISE NOTICE '3. Click "Mark Complete"';
  RAISE NOTICE '4. Should work without 403 error!';
END $$;
