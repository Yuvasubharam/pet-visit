-- =====================================================
-- DIAGNOSE SPECIFIC FAILING BOOKING
-- =====================================================
-- Booking ID from error: 1a453a67-a41d-4059-8dba-a518449d9b51
-- =====================================================

-- Check the booking details
SELECT
  b.id,
  b.user_id as patient_user_id,
  b.doctor_id,
  b.status,
  b.payment_status,
  b.service_type,
  b.booking_type,
  b.date,
  b.time,
  b.created_at,
  -- Get patient info
  u.name as patient_name,
  u.email as patient_email
FROM bookings b
LEFT JOIN users u ON u.id = b.user_id
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- Check if this booking is assigned to any doctor
SELECT
  b.id as booking_id,
  b.doctor_id,
  d.id as doctor_record_id,
  d.user_id as doctor_user_id,
  d.full_name as doctor_name,
  d.email as doctor_email,
  d.is_active as doctor_is_active
FROM bookings b
LEFT JOIN doctors d ON d.id = b.doctor_id
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- =====================================================
-- INTERPRETATION
-- =====================================================

/*
CASE 1: doctor_id IS NULL
  → Booking is unassigned
  → Doctor should be able to UPDATE via "Doctors can accept unassigned bookings" policy
  → But the policy might only allow assigning doctor_id, not updating status

CASE 2: doctor_id has a value
  → Check if this matches the logged-in doctor's ID
  → If yes: Policy should allow update
  → If no: Policy will block update (403 error)

CASE 3: doctor record doesn't exist
  → doctor_id points to non-existent doctor
  → Policy will fail

TO FIX CASE 1:
  The "Doctors can accept unassigned bookings" policy might be too restrictive.
  It should allow doctors to update ANY unassigned consultation, not just accept it.

TO FIX CASE 2:
  Doctor needs to be assigned to the booking first before updating status.

TO FIX CASE 3:
  Data integrity issue - need to fix the booking's doctor_id.
*/
