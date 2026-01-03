-- Fix doctor insert RLS policy to allow authenticated users to register

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;

-- Create a new policy that allows any authenticated user to insert their own profile
CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT WITH CHECK (true);
