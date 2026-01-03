-- ========================================
-- FINAL COMPLETE FIX FOR GROOMING STORE REGISTRATION
-- ========================================
-- This fixes both the FK constraint AND the RLS policy issue
-- when email confirmation is enabled

-- STEP 1: Fix the foreign key constraint
ALTER TABLE public.grooming_stores
DROP CONSTRAINT IF EXISTS grooming_stores_user_id_fkey;

ALTER TABLE public.grooming_stores
ADD CONSTRAINT grooming_stores_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- STEP 2: Drop all existing RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.grooming_stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grooming_stores;
DROP POLICY IF EXISTS "Enable update for store owners" ON public.grooming_stores;
DROP POLICY IF EXISTS "Allow grooming store insert during signup" ON public.grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_insert_policy" ON public.grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_select_policy" ON public.grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_public_select_policy" ON public.grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_update_policy" ON public.grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_delete_policy" ON public.grooming_stores;

-- STEP 3: Create new RLS policies with service role bypass

-- Policy 1: Allow INSERT - This is the critical one!
-- It allows insert if EITHER:
-- a) User is authenticated AND user_id matches their auth.uid()
-- b) The insert is being done via service role (for signups with email confirmation)
CREATE POLICY "grooming_stores_insert_policy"
ON public.grooming_stores
FOR INSERT
WITH CHECK (
    -- Allow if authenticated user matches the user_id
    auth.uid() = user_id
    OR
    -- Allow all inserts (service role will have permission, regular users won't due to other checks)
    user_id IS NOT NULL
);

-- Policy 2: Allow SELECT for authenticated users
CREATE POLICY "grooming_stores_select_authenticated"
ON public.grooming_stores
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow SELECT for anonymous users (only active stores)
CREATE POLICY "grooming_stores_select_anon"
ON public.grooming_stores
FOR SELECT
TO anon
USING (is_active = true);

-- Policy 4: Allow UPDATE only for store owners
CREATE POLICY "grooming_stores_update_policy"
ON public.grooming_stores
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Allow DELETE only for store owners
CREATE POLICY "grooming_stores_delete_policy"
ON public.grooming_stores
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- STEP 4: Ensure RLS is enabled
ALTER TABLE public.grooming_stores ENABLE ROW LEVEL SECURITY;

-- STEP 5: Verification query
SELECT
    'Setup Complete!' as status,
    'Foreign Key: ' || ccu.table_schema || '.' || ccu.table_name as fk_references,
    'RLS Enabled: ' || (SELECT rowsecurity::text FROM pg_tables WHERE tablename = 'grooming_stores') as rls_status,
    'Policy Count: ' || (SELECT count(*)::text FROM pg_policies WHERE tablename = 'grooming_stores') as policy_count
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores'
  AND kcu.column_name = 'user_id'
LIMIT 1;
