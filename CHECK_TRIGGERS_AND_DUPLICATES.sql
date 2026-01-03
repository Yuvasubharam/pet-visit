-- ========================================
-- CHECK FOR TRIGGERS AND DUPLICATE DATA
-- ========================================

-- STEP 1: Check if there's a trigger creating users automatically
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('grooming_stores', 'users')
ORDER BY event_object_table, trigger_name;

-- STEP 2: Check for duplicate phone numbers in users table
SELECT
    id,
    name,
    phone,
    email,
    created_at
FROM public.users
WHERE phone = '9493475556';

-- STEP 3: Check for grooming stores with this phone
SELECT
    id,
    store_name,
    email,
    phone,
    user_id,
    created_at
FROM public.grooming_stores
WHERE phone = '9493475556';

-- STEP 4: Check for orphaned auth users (created but no profile)
SELECT
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    CASE
        WHEN gs.id IS NOT NULL THEN 'Has grooming store'
        WHEN u.id IS NOT NULL THEN 'Has user profile'
        ELSE 'ORPHANED - No profile'
    END as profile_status
FROM auth.users au
LEFT JOIN public.grooming_stores gs ON au.id = gs.user_id
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'yuvasubharam@gmail.com'
ORDER BY au.created_at DESC;

-- STEP 5: Check all triggers on auth.users (might be auto-creating public.users)
SELECT
    n.nspname as schema_name,
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname IN ('auth', 'public')
  AND NOT t.tgisinternal
ORDER BY schema_name, table_name, trigger_name;
