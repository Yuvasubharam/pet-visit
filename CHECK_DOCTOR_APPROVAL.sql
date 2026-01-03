-- =====================================================
-- CHECK DOCTOR APPROVAL STATUS
-- =====================================================
-- Doctor: DIMPLE KUMAR (dimplekumarvasamsetti89@gmail.com)
-- =====================================================

SELECT
  d.id as doctor_id,
  d.user_id as doctor_user_id,
  d.full_name,
  d.email,
  d.is_active,
  d.approval,
  d.is_verified,
  CASE
    WHEN d.approval = 'approved' THEN '✅ APPROVED - Can update bookings'
    WHEN d.approval = 'pending' THEN '⏳ PENDING - Cannot update bookings (blocked by policy)'
    WHEN d.approval = 'rejected' THEN '❌ REJECTED - Cannot update bookings'
    WHEN d.approval IS NULL THEN '⚠️ NO APPROVAL STATUS - May work with some policies'
    ELSE '⚠️ UNKNOWN STATUS: ' || d.approval
  END as approval_status
FROM doctors d
WHERE d.email = 'dimplekumarvasamsetti89@gmail.com';

-- =====================================================
-- DIAGNOSIS
-- =====================================================

/*
If approval is NOT 'approved':
  → The policy "Doctors can update their booking details" will FAIL
  → This policy requires: approval = 'approved'
  → Even though other policies don't require approval, RLS evaluates
    ALL policies and the strict one might be blocking

SOLUTION 1: Set doctor's approval to 'approved'
  UPDATE doctors
  SET approval = 'approved'
  WHERE email = 'dimplekumarvasamsetti89@gmail.com';

SOLUTION 2: Remove the approval requirement from the policy
  DROP POLICY "Doctors can update their booking details" ON bookings;

  CREATE POLICY "Doctors can update their booking details"
  ON bookings FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = bookings.doctor_id
      AND doctors.user_id = auth.uid()
      AND doctors.is_active = true  -- Remove approval check
    )
  );

SOLUTION 3: Just use the policies we already have
  The policy "Doctors can update their assigned bookings" should work
  even without approval. If it's not working, there's an authentication
  issue with auth.uid() not matching doctor.user_id.
*/
