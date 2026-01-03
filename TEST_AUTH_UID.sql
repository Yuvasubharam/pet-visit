-- =====================================================
-- TEST: Check if auth.uid() Matches Doctor User ID
-- =====================================================
-- This simulates what the RLS policy is checking
-- =====================================================

-- Check what auth.uid() currently returns
-- (You must be logged in as the doctor when running this)
SELECT
  auth.uid() as current_auth_uid,
  'Expected: 53aa2978-31b3-4585-8b9f-f0c1883f9156' as expected_doctor_user_id,
  CASE
    WHEN auth.uid() = '53aa2978-31b3-4585-8b9f-f0c1883f9156'::uuid
    THEN '✅ MATCH - Policy should work'
    ELSE '❌ NO MATCH - This is the problem!'
  END as auth_check;

-- Check if the doctor record can be found using auth.uid()
SELECT
  d.id as doctor_id,
  d.user_id as doctor_user_id,
  d.full_name,
  d.email,
  auth.uid() as current_auth_uid,
  CASE
    WHEN d.user_id = auth.uid() THEN '✅ Doctor record matches auth.uid()'
    ELSE '❌ Doctor record does NOT match auth.uid()'
  END as match_status
FROM doctors d
WHERE d.user_id = auth.uid();

-- Simulate the policy check for the specific booking
SELECT
  b.id as booking_id,
  b.doctor_id,
  -- Check if policy USING clause would pass
  (
    b.doctor_id IN (
      SELECT id FROM doctors
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  ) as policy_using_passes,
  -- Check if policy WITH CHECK would pass
  (
    b.doctor_id IN (
      SELECT id FROM doctors
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  ) as policy_with_check_passes,
  auth.uid() as current_auth_uid
FROM bookings b
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- =====================================================
-- INTERPRETATION
-- =====================================================

/*
EXPECTED RESULTS when logged in as the doctor:

Query 1:
  current_auth_uid: 53aa2978-31b3-4585-8b9f-f0c1883f9156
  auth_check: ✅ MATCH

Query 2:
  Should return doctor record with match_status: ✅

Query 3:
  policy_using_passes: true
  policy_with_check_passes: true

IF ANY of these return false/null/empty:
  → The doctor is NOT properly authenticated
  → Check if the doctor is logged in through the correct auth flow
  → Verify the doctor's user_id in the auth.users table

IF ALL return true but still getting 403:
  → There might be a conflicting policy
  → Or the Supabase client isn't passing auth headers correctly
  → Check browser console for auth token issues
*/
