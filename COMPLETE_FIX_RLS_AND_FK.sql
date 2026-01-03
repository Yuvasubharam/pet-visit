-- ========================================
-- COMPLETE FIX: FOREIGN KEY + RLS POLICIES
-- ========================================

-- STEP 1: Check current RLS policies on grooming_stores
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
WHERE tablename = 'grooming_stores';

-- STEP 2: Check existing foreign key constraints
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores'
  AND kcu.column_name = 'user_id';

-- STEP 3: Drop the incorrect foreign key constraint
ALTER TABLE public.grooming_stores
DROP CONSTRAINT IF EXISTS grooming_stores_user_id_fkey;

-- STEP 4: Add correct foreign key to auth.users
ALTER TABLE public.grooming_stores
ADD CONSTRAINT grooming_stores_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- STEP 5: Drop existing policies (we'll recreate them properly)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.grooming_stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grooming_stores;
DROP POLICY IF EXISTS "Enable update for store owners" ON public.grooming_stores;
DROP POLICY IF EXISTS "Allow grooming store insert during signup" ON public.grooming_stores;

-- STEP 6: Create proper RLS policies for grooming stores

-- Policy 1: Allow INSERT during signup (authenticated users can create their own store)
CREATE POLICY "grooming_stores_insert_policy"
ON public.grooming_stores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Allow SELECT for all authenticated users (so stores can be browsed)
CREATE POLICY "grooming_stores_select_policy"
ON public.grooming_stores
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow public SELECT for active stores (for browsing without login)
CREATE POLICY "grooming_stores_public_select_policy"
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

-- STEP 7: Verify RLS is enabled
ALTER TABLE public.grooming_stores ENABLE ROW LEVEL SECURITY;

-- STEP 8: Verify the setup
SELECT
    'Foreign Keys' as check_type,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores'
  AND kcu.column_name = 'user_id'

UNION ALL

SELECT
    'RLS Policies' as check_type,
    policyname,
    cmd::text,
    roles::text,
    CASE
        WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END
FROM pg_policies
WHERE tablename = 'grooming_stores'
ORDER BY check_type, constraint_name;
