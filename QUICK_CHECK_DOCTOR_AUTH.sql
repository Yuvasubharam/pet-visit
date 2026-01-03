-- =====================================================
-- QUICK CHECK: Is the logged-in user the correct doctor?
-- =====================================================
-- Run this while logged in as the doctor in your app

-- Check 1: Who am I logged in as?
SELECT
  auth.uid() as my_user_id,
  auth.email() as my_email;

-- Check 2: Am I a doctor?
SELECT
  id as doctor_id,
  full_name,
  email,
  user_id,
  is_active,
  CASE
    WHEN user_id = auth.uid() THEN '✅ This is ME!'
    ELSE '❌ This is NOT me'
  END as am_i_this_doctor
FROM doctors
WHERE user_id = auth.uid();

-- Check 3: Can I see the booking I'm trying to update?
SELECT
  b.id as booking_id,
  b.status,
  b.doctor_id,
  d.full_name as doctor_name,
  d.user_id as doctor_user_id,
  d.is_active as doctor_is_active,
  CASE
    WHEN d.user_id = auth.uid() THEN '✅ I AM assigned to this booking'
    ELSE '❌ I am NOT assigned to this booking'
  END as assignment_status
FROM bookings b
LEFT JOIN doctors d ON b.doctor_id = d.id
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- Check 4: Summary - Can I update this booking?
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM bookings b
      INNER JOIN doctors d ON b.doctor_id = d.id
      WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51'
      AND d.user_id = auth.uid()
      AND d.is_active = true
    ) THEN '✅ YES - You should be able to update this booking!'
    ELSE '❌ NO - There is a problem. Check the results above.'
  END as can_i_update;
