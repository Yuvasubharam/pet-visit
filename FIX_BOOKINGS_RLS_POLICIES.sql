-- =====================================================
-- Fix Bookings RLS Policies for User Dashboard
-- =====================================================
-- This ensures users can view their own bookings
-- =====================================================

-- =====================================================
-- PART 1: Check Current RLS Status
-- =====================================================

-- Check if RLS is enabled on bookings table
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'bookings';

-- Check existing policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bookings';

-- =====================================================
-- PART 2: Enable RLS if not already enabled
-- =====================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 3: Drop and Recreate User Booking Policies
-- =====================================================

-- Drop existing user policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- Create SELECT policy - Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create INSERT policy - Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy - Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy - Users can delete their own bookings (optional)
CREATE POLICY "Users can delete their own bookings"
ON bookings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- PART 4: Doctor Policies (if needed)
-- =====================================================

-- Drop existing doctor policies
DROP POLICY IF EXISTS "Doctors can view their assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;

-- Doctors can view bookings assigned to them or unassigned bookings
CREATE POLICY "Doctors can view their assigned bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
  OR doctor_id IS NULL
);

-- Doctors can update bookings assigned to them
CREATE POLICY "Doctors can update their assigned bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- PART 5: Verify Policies are Working
-- =====================================================

-- Test query (run this as the authenticated user)
-- This should return the user's bookings
/*
SELECT
  id,
  service_type,
  booking_type,
  status,
  date,
  time,
  created_at
FROM bookings
WHERE user_id = auth.uid()
ORDER BY date DESC;
*/

-- =====================================================
-- PART 6: Check Related Tables RLS
-- =====================================================

-- Ensure pets table has proper RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pets" ON pets;
CREATE POLICY "Users can view their own pets"
ON pets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own pets" ON pets;
CREATE POLICY "Users can insert their own pets"
ON pets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own pets" ON pets;
CREATE POLICY "Users can update their own pets"
ON pets FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own pets" ON pets;
CREATE POLICY "Users can delete their own pets"
ON pets FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Ensure addresses table has proper RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;
CREATE POLICY "Users can view their own addresses"
ON addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;
CREATE POLICY "Users can insert their own addresses"
ON addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
CREATE POLICY "Users can update their own addresses"
ON addresses FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;
CREATE POLICY "Users can delete their own addresses"
ON addresses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to view doctor profiles (public data)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active doctors" ON doctors;
CREATE POLICY "Anyone can view active doctors"
ON doctors FOR SELECT
TO authenticated
USING (is_active = true);

-- =====================================================
-- PART 7: Verification Queries
-- =====================================================

-- Count policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('bookings', 'pets', 'addresses', 'doctors')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- List all policies for bookings
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY cmd, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies Updated Successfully!';
  RAISE NOTICE '📊 Users can now view their bookings in the dashboard';
  RAISE NOTICE '👨‍⚕️ Doctors can view and update their assigned bookings';
  RAISE NOTICE '🔒 All related tables (pets, addresses) have proper RLS';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 To test:';
  RAISE NOTICE '1. Open your app as a user';
  RAISE NOTICE '2. Check browser console (F12)';
  RAISE NOTICE '3. Look for [Home] logs showing bookings fetched';
  RAISE NOTICE '4. Verify upcoming consultation appears above Quick Services';
END $$;

-- =====================================================
-- Optional: Create Test Booking
-- =====================================================

-- Uncomment and run this to create a test upcoming booking
/*
-- First, get your user_id and pet_id
-- SELECT id, name FROM users WHERE email = 'your-email@example.com';
-- SELECT id, name FROM pets WHERE user_id = 'YOUR_USER_ID';

INSERT INTO bookings (
  user_id,
  pet_id,
  service_type,
  booking_type,
  date,
  time,
  status,
  payment_status,
  payment_amount,
  contact_number
) VALUES (
  'YOUR_USER_ID',        -- Replace with your user ID
  'YOUR_PET_ID',         -- Replace with your pet ID
  'consultation',
  'online',
  '2026-01-15',          -- Future date
  '14:30',               -- Future time (use HH:MM format)
  'upcoming',
  'paid',
  500.00,
  '1234567890'
) RETURNING id, date, time, status;
*/
