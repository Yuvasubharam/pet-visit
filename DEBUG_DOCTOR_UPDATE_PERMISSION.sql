-- =====================================================
-- DEBUG: Why Doctor Can't Update Booking
-- =====================================================
-- This helps diagnose why the 403 error is occurring
-- =====================================================

-- STEP 1: Check if the doctor exists and get their IDs
-- Replace 'doctor@example.com' with the actual doctor's email
SELECT
  d.id as doctor_id,
  d.user_id as doctor_user_id,
  d.full_name,
  d.email,
  d.is_active
FROM doctors d
WHERE d.email = 'doctor@example.com'  -- ⚠️ REPLACE WITH ACTUAL EMAIL
LIMIT 1;

-- STEP 2: Check the booking and its current assignment
-- Replace with the actual booking ID from the error
SELECT
  b.id as booking_id,
  b.user_id as patient_user_id,
  b.doctor_id as assigned_doctor_id,
  b.status,
  b.payment_status,
  b.service_type,
  b.booking_type,
  b.date,
  b.time,
  -- Check if doctor matches
  (SELECT d.id FROM doctors d WHERE d.user_id = b.doctor_id) as doctor_check
FROM bookings b
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51'  -- ⚠️ FROM YOUR ERROR LOG
LIMIT 1;

-- STEP 3: Simulate the policy check
-- This shows what the policy SHOULD evaluate to
WITH current_auth AS (
  -- Replace with the doctor's user_id from STEP 1
  SELECT 'REPLACE_WITH_DOCTOR_USER_ID'::uuid as uid
),
booking_info AS (
  SELECT * FROM bookings
  WHERE id = '1a453a67-a41d-4059-8dba-a518449d9b51'  -- ⚠️ FROM YOUR ERROR LOG
)
SELECT
  b.id,
  b.doctor_id,
  b.status,
  -- Check if doctor_id matches a doctor record for current user
  EXISTS (
    SELECT 1 FROM doctors d
    WHERE d.id = b.doctor_id
    AND d.user_id = (SELECT uid FROM current_auth)
  ) as would_policy_allow_update,
  -- Check if booking is unassigned
  (b.doctor_id IS NULL) as is_unassigned
FROM booking_info b;

-- STEP 4: List all UPDATE policies to see which one might be blocking
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'bookings'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================

/*
STEP 1 should return:
  - doctor_id (UUID)
  - doctor_user_id (UUID)
  - is_active: true

STEP 2 should return:
  - assigned_doctor_id should match doctor_id from STEP 1

STEP 3 should return:
  - would_policy_allow_update: true

If STEP 3 returns false, then the policy is blocking the update.

STEP 4 should show policies including:
  - "Doctors can update their assigned bookings"
  - "Doctors can accept unassigned bookings"

If these policies are missing, you need to run Parts 2-4 of
COMPLETE_FIX_DOCTOR_UPDATE_STATUS.sql
*/
