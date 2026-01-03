-- =====================================================
-- Cleanup Duplicate RLS Policies for doctor_reviews
-- =====================================================
-- Run this first to remove all existing policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can insert reviews for their bookings" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON doctor_reviews;

-- Now create clean, non-duplicate policies

-- Allow everyone to view reviews (even non-authenticated for public display)
CREATE POLICY "Anyone can view reviews"
ON doctor_reviews FOR SELECT
TO public
USING (true);

-- Users can insert reviews for their own bookings
CREATE POLICY "Users can create their own reviews"
ON doctor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON doctor_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON doctor_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'doctor_reviews'
ORDER BY cmd, policyname;
