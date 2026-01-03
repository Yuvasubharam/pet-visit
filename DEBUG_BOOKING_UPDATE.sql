-- =====================================================
-- DEBUG: Why can't doctor update this booking?
-- =====================================================

-- 1. Check the booking details
SELECT
  id,
  doctor_id,
  user_id as patient_user_id,
  status,
  service_type
FROM bookings
WHERE id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- 2. Check the doctor's user_id
SELECT
  id as doctor_id,
  user_id as doctor_user_id,
  full_name,
  is_active
FROM doctors
WHERE id = 'bac55b1b-b1f1-40b4-8ef3-bca09465a7f2';

-- 3. Check current authenticated user
SELECT auth.uid() as current_user_id;

-- 4. Test if the policy condition would match
-- (Run this while logged in as the doctor)
SELECT
  b.id as booking_id,
  b.doctor_id,
  d.user_id as doctor_user_id,
  d.is_active,
  auth.uid() as current_user_id,
  -- Check if current user matches doctor's user_id
  (auth.uid() = d.user_id) as user_matches,
  -- Check if doctor is active
  d.is_active as is_active_doctor,
  -- Check if policy would allow
  (
    auth.uid() = b.user_id
    OR
    b.doctor_id IN (
      SELECT id FROM doctors
      WHERE user_id = auth.uid() AND is_active = true
    )
  ) as policy_would_allow
FROM bookings b
LEFT JOIN doctors d ON b.doctor_id = d.id
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- 5. View current RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bookings' AND cmd = 'UPDATE';
