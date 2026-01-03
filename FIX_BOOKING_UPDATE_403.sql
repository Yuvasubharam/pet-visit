-- =====================================================
-- COMPREHENSIVE FIX: Doctor Booking Update 403 Error
-- =====================================================

-- Step 1: Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing UPDATE policies to start fresh
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow booking updates by owners and doctors" ON bookings;
  DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;
  DROP POLICY IF EXISTS "Doctors can update their booking details" ON bookings;
  DROP POLICY IF EXISTS "Doctors can accept unassigned bookings" ON bookings;
  DROP POLICY IF EXISTS "Doctor update assigned bookings" ON bookings;
  DROP POLICY IF EXISTS "Allow updates by booking owner or assigned doctor" ON bookings;
END $$;

-- Step 3: Create a comprehensive UPDATE policy
CREATE POLICY "booking_update_policy"
ON bookings
FOR UPDATE
TO authenticated
USING (
  -- Case 1: User owns the booking (patient)
  auth.uid() = user_id
  OR
  -- Case 2: Doctor is assigned to this booking
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = bookings.doctor_id
    AND doctors.user_id = auth.uid()
    AND doctors.is_active = true
  )
  OR
  -- Case 3: Doctor can accept unassigned consultation bookings
  (
    doctor_id IS NULL
    AND service_type = 'consultation'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.user_id = auth.uid()
      AND doctors.is_active = true
    )
  )
)
WITH CHECK (
  -- After update, ensure the booking still belongs to user or assigned doctor
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = bookings.doctor_id
    AND doctors.user_id = auth.uid()
    AND doctors.is_active = true
  )
);

-- Step 4: Verify the policy was created
SELECT
  policyname,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'bookings' AND cmd = 'UPDATE';

-- Step 5: Test the policy with the specific booking
-- (This will show if the policy would allow the update)
SELECT
  b.id,
  b.status,
  b.doctor_id,
  d.user_id as doctor_user_id,
  d.is_active,
  'Policy conditions:' as check_label,
  -- Check condition 1: Is patient
  (auth.uid() = b.user_id) as is_patient,
  -- Check condition 2: Is assigned doctor
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = b.doctor_id
    AND doctors.user_id = auth.uid()
    AND doctors.is_active = true
  ) as is_assigned_doctor
FROM bookings b
LEFT JOIN doctors d ON b.doctor_id = d.id
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Booking UPDATE Policy Fixed!';
  RAISE NOTICE '';
  RAISE NOTICE 'The policy now allows:';
  RAISE NOTICE '1. ✓ Patients to update their own bookings';
  RAISE NOTICE '2. ✓ Doctors to update bookings assigned to them';
  RAISE NOTICE '3. ✓ Doctors to accept unassigned consultations';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next steps:';
  RAISE NOTICE '1. Log in as the doctor in your app';
  RAISE NOTICE '2. Navigate to the consultation details';
  RAISE NOTICE '3. Click "Mark Complete"';
  RAISE NOTICE '4. Check browser console for any errors';
END $$;
