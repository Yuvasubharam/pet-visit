-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT FOR GROOMING STORES
-- =====================================================

-- The issue: grooming_stores has a foreign key to a 'users' table
-- But Supabase Auth users are in 'auth.users', not 'public.users'

-- STEP 1: Drop the incorrect foreign key constraint
ALTER TABLE public.grooming_stores
DROP CONSTRAINT IF EXISTS grooming_stores_user_id_fkey;

-- STEP 2: Add correct foreign key to auth.users
ALTER TABLE public.grooming_stores
ADD CONSTRAINT grooming_stores_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- STEP 3: Verify the constraint
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.grooming_stores'::regclass
AND conname = 'grooming_stores_user_id_fkey';

-- Expected output:
-- constraint_name: grooming_stores_user_id_fkey
-- constraint_type: f (foreign key)
-- definition: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

-- =====================================================
-- FIX COMPLETE!
-- =====================================================

-- Now the foreign key correctly references auth.users
-- Registration will work because auth.uid() from signUp
-- creates a record in auth.users that can be referenced
