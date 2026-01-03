-- =====================================================
-- VIEW FULL POLICY DEFINITIONS
-- =====================================================
-- This shows the exact logic of each UPDATE policy
-- =====================================================

SELECT
  policyname,
  permissive,
  roles,
  -- Format the USING clause nicely
  CASE
    WHEN qual IS NOT NULL
    THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_expression,
  -- Format the WITH CHECK clause nicely
  CASE
    WHEN with_check IS NOT NULL
    THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_expression
FROM pg_policies
WHERE tablename = 'bookings'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- =====================================================
-- EXPLANATION
-- =====================================================

/*
For a doctor to update a booking, they need to pass the USING clause
of at least ONE policy (since all policies are permissive).

Potential Issues:
1. If "Users can update their own bookings" has:
   USING: auth.uid() = user_id
   This will FAIL for doctors since user_id is the patient.

2. "Doctors can update their assigned bookings" should have:
   USING: doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
   This will PASS only if the booking is assigned to the doctor.

3. If there are conflicting WITH CHECK clauses, the update might fail.

Look for the exact expressions above to diagnose the issue.
*/
