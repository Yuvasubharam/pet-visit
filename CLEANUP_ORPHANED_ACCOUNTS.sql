-- ========================================
-- CLEANUP ORPHANED TEST ACCOUNTS
-- ========================================
-- Run this to clean up failed registration attempts

-- STEP 1: Find all orphaned grooming store auth accounts
SELECT
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'user_type' as user_type,
    'No grooming store profile' as status
FROM auth.users au
LEFT JOIN public.grooming_stores gs ON au.id = gs.user_id
WHERE gs.id IS NULL
  AND au.raw_user_meta_data->>'user_type' = 'grooming_store'
ORDER BY au.created_at DESC;

-- STEP 2: Find the specific failed account
SELECT
    au.id as auth_user_id,
    au.email,
    au.created_at,
    gs.id as store_id,
    u.id as user_profile_id,
    u.phone
FROM auth.users au
LEFT JOIN public.grooming_stores gs ON au.id = gs.user_id
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'yuvasubharam@gmail.com'
ORDER BY au.created_at DESC;

-- STEP 3: Clean up - DELETE the orphaned accounts for yuvasubharam@gmail.com
-- IMPORTANT: Review the results from STEP 2 before running this!

-- First, delete from public.users if exists (due to cascade, or manually)
DELETE FROM public.users
WHERE id IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN public.grooming_stores gs ON au.id = gs.user_id
    WHERE au.email = 'yuvasubharam@gmail.com'
      AND gs.id IS NULL
);

-- Then delete from auth.users (this will cascade delete related records)
DELETE FROM auth.users
WHERE email = 'yuvasubharam@gmail.com'
  AND id IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN public.grooming_stores gs ON au.id = gs.user_id
    WHERE au.email = 'yuvasubharam@gmail.com'
      AND gs.id IS NULL
  );

-- STEP 4: Verify cleanup
SELECT
    'Cleanup Complete!' as status,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'yuvasubharam@gmail.com') as remaining_auth_users,
    (SELECT COUNT(*) FROM public.users WHERE phone = '9493475556') as remaining_user_profiles,
    (SELECT COUNT(*) FROM public.grooming_stores WHERE email = 'yuvasubharam@gmail.com') as remaining_stores;
