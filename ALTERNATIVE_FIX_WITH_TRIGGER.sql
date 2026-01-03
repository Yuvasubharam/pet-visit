-- ========================================
-- ALTERNATIVE FIX: AUTO-CREATE USERS RECORD
-- ========================================
-- This approach creates a public.users record automatically
-- when a grooming store signs up, if the FK points to public.users

-- Option 1: Create a trigger function to auto-create users record
CREATE OR REPLACE FUNCTION public.create_user_for_grooming_store()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user exists in public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
        -- Create a basic user record
        INSERT INTO public.users (id, name, phone, email)
        VALUES (
            NEW.user_id,
            NEW.store_name,
            COALESCE(NEW.phone, ''),
            NEW.email
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Option 2: Create trigger on grooming_stores BEFORE INSERT
DROP TRIGGER IF EXISTS ensure_user_exists_for_grooming_store ON public.grooming_stores;

CREATE TRIGGER ensure_user_exists_for_grooming_store
    BEFORE INSERT ON public.grooming_stores
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_for_grooming_store();

-- Option 3: Alternative - Check RLS policies on grooming_stores
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

-- Option 4: If RLS is blocking, you might need to add a policy
-- First check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'grooming_stores';

-- If RLS is enabled, ensure there's an INSERT policy
-- Example policy (adjust based on your needs):
DROP POLICY IF EXISTS "Allow grooming store insert during signup" ON public.grooming_stores;

CREATE POLICY "Allow grooming store insert during signup"
ON public.grooming_stores
FOR INSERT
WITH CHECK (true);  -- Adjust this based on your security requirements

-- Or more restrictive:
-- CREATE POLICY "Allow grooming store insert during signup"
-- ON public.grooming_stores
-- FOR INSERT
-- WITH CHECK (auth.uid() = user_id);
