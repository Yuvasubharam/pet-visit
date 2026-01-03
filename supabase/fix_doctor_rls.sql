-- Run this in Supabase SQL Editor to fix doctor registration RLS policy

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;

-- Create a new policy that allows authenticated users to insert
CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
