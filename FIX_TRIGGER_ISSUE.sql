-- ========================================
-- FIX THE TRIGGER CAUSING DUPLICATE PHONE ERROR
-- ========================================

-- STEP 1: Check the current trigger function
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'create_user_for_grooming_store';

-- STEP 2: Drop the problematic trigger
-- This trigger was trying to auto-create a public.users record,
-- but grooming stores don't need entries in the public.users table
-- (that table is for regular customers, not stores)
DROP TRIGGER IF EXISTS ensure_user_exists_for_grooming_store ON public.grooming_stores;

-- STEP 3: Drop the function as well (optional, but clean)
DROP FUNCTION IF EXISTS public.create_user_for_grooming_store();

-- STEP 4: Verify triggers are gone
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'grooming_stores';

-- STEP 5: Clean up any orphaned records from failed attempts
-- First check what exists
SELECT
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users
WHERE email = 'yuvasubharam@gmail.com'

UNION ALL

SELECT
    'Public Users' as table_name,
    COUNT(*) as count
FROM public.users
WHERE phone = '9493475556' OR email = 'yuvasubharam@gmail.com'

UNION ALL

SELECT
    'Grooming Stores' as table_name,
    COUNT(*) as count
FROM public.grooming_stores
WHERE email = 'yuvasubharam@gmail.com';

-- STEP 6: Clean up orphaned auth users (no grooming store profile)
DELETE FROM auth.users
WHERE email = 'yuvasubharam@gmail.com'
  AND id NOT IN (
    SELECT user_id FROM public.grooming_stores WHERE user_id IS NOT NULL
  );

-- STEP 7: Clean up orphaned public.users records created by the trigger
DELETE FROM public.users
WHERE (phone = '9493475556' OR email = 'yuvasubharam@gmail.com')
  AND id NOT IN (
    -- Keep users that have actual user data (pets, bookings, etc.)
    SELECT DISTINCT user_id FROM public.pets WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id FROM public.bookings WHERE user_id IS NOT NULL
  );

-- STEP 8: Verification - should all be 0
SELECT
    'Cleanup Verification' as status,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'yuvasubharam@gmail.com') as auth_users,
    (SELECT COUNT(*) FROM public.users WHERE phone = '9493475556') as public_users_with_phone,
    (SELECT COUNT(*) FROM public.grooming_stores WHERE email = 'yuvasubharam@gmail.com') as grooming_stores;
