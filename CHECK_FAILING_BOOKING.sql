-- =====================================================
-- CHECK THE FAILING BOOKING
-- =====================================================
-- Booking ID: 1a453a67-a41d-4059-8dba-a518449d9b51
-- =====================================================

SELECT
  b.id,
  b.doctor_id,
  b.user_id as patient_user_id,
  b.status,
  b.payment_status,
  CASE
    WHEN b.doctor_id IS NULL THEN '❌ UNASSIGNED - Doctor needs to accept first'
    ELSE '✅ Assigned to doctor: ' || COALESCE(d.full_name, 'Unknown')
  END as assignment_status,
  d.full_name as assigned_doctor_name,
  d.email as assigned_doctor_email,
  d.user_id as assigned_doctor_user_id
FROM bookings b
LEFT JOIN doctors d ON d.id = b.doctor_id
WHERE b.id = '1a453a67-a41d-4059-8dba-a518449d9b51';

-- =====================================================
-- WHAT TO DO NEXT
-- =====================================================

/*
RESULT 1: doctor_id IS NULL (unassigned)
  → The booking hasn't been assigned to the doctor yet
  → The doctor must first "Accept" the booking
  → Only then can they update status to "completed"

  FIX: Update DoctorConsultationDetails.tsx to check if
       booking is assigned before allowing status updates.

RESULT 2: doctor_id is assigned but doesn't match logged-in doctor
  → The booking is assigned to a different doctor
  → Current doctor cannot update it

  FIX: Ensure the correct doctor is logged in, or reassign
       the booking to the current doctor.

RESULT 3: doctor_id matches the logged-in doctor
  → This shouldn't cause a 403 error
  → There might be an issue with how the doctor is logged in
  → Or the doctor's approval status (note the third policy
    requires approval = 'approved')

  FIX: Check doctor's approval status and authentication.
*/
