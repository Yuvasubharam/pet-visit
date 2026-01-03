-- =====================================================
-- FIX GROOMING STORE REGISTRATION RLS POLICY
-- =====================================================

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Grooming store owners can view own store" ON public.grooming_stores;
DROP POLICY IF EXISTS "Grooming store owners can update own store" ON public.grooming_stores;
DROP POLICY IF EXISTS "Public can view active grooming stores" ON public.grooming_stores;

-- Create new policies that allow registration

-- 1. Allow authenticated users to INSERT (for registration)
CREATE POLICY "Authenticated users can create grooming store"
ON public.grooming_stores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Store owners can view their own store
CREATE POLICY "Grooming store owners can view own store"
ON public.grooming_stores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Store owners can update their own store
CREATE POLICY "Grooming store owners can update own store"
ON public.grooming_stores
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Public (including anon) can view active stores
CREATE POLICY "Public can view active grooming stores"
ON public.grooming_stores
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Verify policies are created
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
WHERE tablename = 'grooming_stores'
ORDER BY policyname;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
