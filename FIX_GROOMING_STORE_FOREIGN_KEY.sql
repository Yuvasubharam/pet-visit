-- ========================================
-- FIX GROOMING STORE FOREIGN KEY ISSUE
-- ========================================

-- Step 1: Check the current foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores'
  AND kcu.column_name = 'user_id';

-- Step 2: Drop the incorrect foreign key constraint if it exists
ALTER TABLE public.grooming_stores
DROP CONSTRAINT IF EXISTS grooming_stores_user_id_fkey;

-- Step 3: Recreate the correct foreign key constraint pointing to auth.users
ALTER TABLE public.grooming_stores
ADD CONSTRAINT grooming_stores_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- Step 4: Verify the fix
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='grooming_stores'
  AND kcu.column_name = 'user_id';
