-- =====================================================
-- DIAGNOSE AND FIX FOREIGN KEY ISSUES
-- =====================================================

-- STEP 1: Check ALL constraints on grooming_stores table
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.grooming_stores'::regclass;

-- STEP 2: Drop ALL foreign key constraints on user_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.grooming_stores'::regclass
        AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%user_id%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.grooming_stores DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- STEP 3: Check if public.users table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
) AS public_users_exists;

-- STEP 4: Add the correct foreign key constraint to auth.users
ALTER TABLE public.grooming_stores
ADD CONSTRAINT grooming_stores_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- STEP 5: Verify the new constraint
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.grooming_stores'::regclass
AND contype = 'f';

-- STEP 6: Test that we can query auth.users
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- =====================================================
-- EXPECTED OUTPUT:
-- =====================================================
-- Step 1: Shows all current constraints
-- Step 2: Drops all user_id foreign keys
-- Step 3: Shows if public.users exists (should be false)
-- Step 4: Creates correct FK to auth.users
-- Step 5: Shows only the correct FK constraint
-- Step 6: Shows count of users in auth.users
