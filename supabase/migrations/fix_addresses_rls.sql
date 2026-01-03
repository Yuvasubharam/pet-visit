-- Fix RLS policies for addresses table
-- This file sets up proper Row Level Security policies for the addresses table

-- Enable RLS on addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;

-- Policy: Users can view their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
ON public.addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.addresses
FOR DELETE
USING (auth.uid() = user_id);
