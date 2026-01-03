-- ============================================
-- COMPREHENSIVE FIX: Storage Buckets & RLS Policies
-- ============================================
-- This fixes the photo upload issues by:
-- 1. Creating storage buckets
-- 2. Setting up proper RLS policies that work with doctor_id
-- 3. Fixing doctor table RLS policies
-- 4. Enabling necessary storage extensions

-- ============================================
-- STEP 1: Drop existing conflicting policies
-- ============================================

-- Drop all existing storage policies for doctor-photos
DROP POLICY IF EXISTS "Public can view doctor photos" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete their own photos" ON storage.objects;

-- Drop all existing storage policies for doctor-credentials
DROP POLICY IF EXISTS "Doctors can upload their own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view their own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update their own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete their own credentials" ON storage.objects;

-- ============================================
-- STEP 2: Create Storage Buckets
-- ============================================

-- Create bucket for doctor profile photos (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create bucket for doctor credentials (private access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-credentials', 'doctor-credentials', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ============================================
-- STEP 3: Helper function to check if user owns the doctor profile
-- ============================================

CREATE OR REPLACE FUNCTION public.is_doctor_owner(doctor_id_from_path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.doctors
    WHERE id::text = doctor_id_from_path
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Storage Policies for doctor-photos bucket
-- ============================================

-- Policy: Allow anyone to view doctor photos (public read)
CREATE POLICY "Public can view doctor photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-photos');

-- Policy: Allow authenticated doctors to upload photos to their own folder
-- Folder structure: {doctor_id}/profile.{ext}
CREATE POLICY "Doctors can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- Policy: Allow authenticated doctors to update their own photos
CREATE POLICY "Doctors can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- Policy: Allow authenticated doctors to delete their own photos
CREATE POLICY "Doctors can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- ============================================
-- STEP 5: Storage Policies for doctor-credentials bucket
-- ============================================

-- Policy: Allow doctors to upload their own credentials
CREATE POLICY "Doctors can upload their own credentials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- Policy: Allow doctors to view their own credentials
CREATE POLICY "Doctors can view their own credentials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- Policy: Allow doctors to update their own credentials
CREATE POLICY "Doctors can update their own credentials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- Policy: Allow doctors to delete their own credentials
CREATE POLICY "Doctors can delete their own credentials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND public.is_doctor_owner((storage.foldername(name))[1])
);

-- ============================================
-- STEP 6: Fix Doctor Table RLS Policies
-- ============================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Doctors can insert own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can view own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;
DROP POLICY IF EXISTS "Anyone can view active doctors" ON doctors;

-- Allow any authenticated user to insert their doctor profile
CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow doctors to view their own profile
CREATE POLICY "Doctors can view own profile" ON doctors
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow doctors to update their own profile
CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow anyone to view active and verified doctors
CREATE POLICY "Anyone can view active doctors" ON doctors
  FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if buckets were created
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('doctor-photos', 'doctor-credentials');

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%doctor%'
ORDER BY policyname;

-- Check doctor table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY policyname;
