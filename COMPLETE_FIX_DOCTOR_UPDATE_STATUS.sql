-- =====================================================
-- COMPLETE FIX: Doctor Status Update Issues
-- =====================================================
-- This migration fixes BOTH the 400 and 403 errors when
-- doctors try to mark consultations as complete.
--
-- Issues Fixed:
-- 1. 400 Error: 'cod' not allowed in payment_status
-- 2. 403 Error: Doctors can't update booking status
-- =====================================================

-- =====================================================
-- PART 1: Fix Payment Status Constraint (400 Error)
-- =====================================================

-- Drop the existing constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Add the new constraint with 'cod' included
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));

-- Also update the orders table if it has the same constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));

-- =====================================================
-- PART 2: Fix Doctor RLS Policies (403 Error)
-- =====================================================

-- Drop existing doctor update policy
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;

-- Create new policy that allows doctors to update status and payment_status
CREATE POLICY "Doctors can update their assigned bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  -- Doctor can update if the booking is assigned to them
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- Allow doctor to update status and payment_status
  -- while keeping doctor_id the same
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- PART 3: Ensure Doctor Can Also Accept Bookings
-- =====================================================

-- Drop and recreate the view policy to also allow unassigned bookings
DROP POLICY IF EXISTS "Doctors can view their assigned bookings" ON bookings;

CREATE POLICY "Doctors can view their assigned bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  -- Doctors can view bookings assigned to them OR unassigned bookings
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
  OR doctor_id IS NULL
);

-- =====================================================
-- PART 4: Allow Doctors to Accept Unassigned Bookings
-- =====================================================

-- Create policy for doctors to accept (update) unassigned bookings
DROP POLICY IF EXISTS "Doctors can accept unassigned bookings" ON bookings;

CREATE POLICY "Doctors can accept unassigned bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  -- Can update if booking is currently unassigned
  doctor_id IS NULL
  AND service_type = 'consultation'
)
WITH CHECK (
  -- After update, doctor_id should be the accepting doctor
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- PART 5: Verification
-- =====================================================

-- List all booking policies
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY cmd, policyname;

-- Check the payment_status constraint
SELECT
  conname,
  pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND conname = 'bookings_payment_status_check';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All Fixes Applied Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Payment status now accepts: pending, paid, failed, cod';
  RAISE NOTICE '✓ Doctors can now update their assigned booking status';
  RAISE NOTICE '✓ Doctors can accept unassigned bookings';
  RAISE NOTICE '✓ Doctors can mark consultations as complete';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test Steps:';
  RAISE NOTICE '1. Login as a doctor';
  RAISE NOTICE '2. Go to a consultation';
  RAISE NOTICE '3. Click "Mark Complete"';
  RAISE NOTICE '4. Status should update without errors';
END $$;
