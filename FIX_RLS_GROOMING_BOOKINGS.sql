-- ================================================================
-- Fix RLS Policies for Grooming Store Bookings
-- Allow grooming stores to read pet, user, and address data
-- for their bookings
-- ================================================================

-- Drop existing policies if they exist (optional, for clean slate)
DROP POLICY IF EXISTS "grooming_stores_read_booking_pets" ON pets;
DROP POLICY IF EXISTS "grooming_stores_read_booking_users" ON users;
DROP POLICY IF EXISTS "grooming_stores_read_booking_addresses" ON addresses;

-- ================================================================
-- PETS TABLE - Allow grooming stores to read pet data for their bookings
-- ================================================================

CREATE POLICY "grooming_stores_read_booking_pets"
ON pets
FOR SELECT
TO authenticated
USING (
  -- User can read their own pets
  auth.uid() = user_id
  OR
  -- Grooming store can read pets that have bookings with their store
  EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN grooming_stores gs ON b.grooming_store_id = gs.id
    WHERE b.pet_id = pets.id
      AND gs.user_id = auth.uid()
      AND b.service_type = 'grooming'
  )
);

-- ================================================================
-- USERS TABLE - Allow grooming stores to read user data for their bookings
-- ================================================================

CREATE POLICY "grooming_stores_read_booking_users"
ON users
FOR SELECT
TO authenticated
USING (
  -- User can read their own data
  auth.uid() = id
  OR
  -- Grooming store can read users that have bookings with their store
  EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN grooming_stores gs ON b.grooming_store_id = gs.id
    WHERE b.user_id = users.id
      AND gs.user_id = auth.uid()
      AND b.service_type = 'grooming'
  )
);

-- ================================================================
-- ADDRESSES TABLE - Allow grooming stores to read address data for their bookings
-- ================================================================

CREATE POLICY "grooming_stores_read_booking_addresses"
ON addresses
FOR SELECT
TO authenticated
USING (
  -- User can read their own addresses
  auth.uid() = user_id
  OR
  -- Grooming store can read addresses that are used in bookings with their store
  EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN grooming_stores gs ON b.grooming_store_id = gs.id
    WHERE b.address_id = addresses.id
      AND gs.user_id = auth.uid()
      AND b.service_type = 'grooming'
  )
);

-- ================================================================
-- Verify the policies were created
-- ================================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('pets', 'users', 'addresses')
  AND policyname LIKE '%grooming_stores%'
ORDER BY tablename, policyname;
