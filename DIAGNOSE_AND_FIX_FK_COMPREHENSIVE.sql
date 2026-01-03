-- ========================================
-- COMPREHENSIVE DIAGNOSIS AND FIX
-- ========================================

-- STEP 1: Check ALL foreign key constraints on grooming_stores table
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores';

-- STEP 2: Check the grooming_stores table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'grooming_stores'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: Drop ALL foreign key constraints on user_id
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'grooming_stores'
          AND tc.table_schema = 'public'
          AND EXISTS (
              SELECT 1
              FROM information_schema.key_column_usage kcu
              WHERE kcu.constraint_name = tc.constraint_name
                AND kcu.column_name = 'user_id'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.grooming_stores DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- STEP 4: Add the CORRECT foreign key constraint to auth.users
ALTER TABLE public.grooming_stores
ADD CONSTRAINT grooming_stores_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- STEP 5: Verify the fix worked
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores'
  AND kcu.column_name = 'user_id';

-- Expected result: Should show auth.users as the foreign table
