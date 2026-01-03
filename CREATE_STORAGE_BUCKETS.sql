-- ============================================
-- Storage Buckets Setup for Doctor Photos & Credentials
-- ============================================
-- Run this SQL in Supabase SQL Editor to fix the photo upload issue
-- This will create storage buckets and set up proper access policies

-- ============================================
-- STEP 1: Create Storage Buckets
-- ============================================

-- Create bucket for doctor profile photos (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for doctor credentials (private access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-credentials', 'doctor-credentials', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Storage Policies for doctor-photos bucket
-- ============================================

-- Policy: Allow anyone to view doctor photos (public read)
CREATE POLICY "Public can view doctor photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-photos');

-- Policy: Allow authenticated doctors to upload their own photos
CREATE POLICY "Doctors can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated doctors to update their own photos
CREATE POLICY "Doctors can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated doctors to delete their own photos
CREATE POLICY "Doctors can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- STEP 3: Storage Policies for doctor-credentials bucket
-- ============================================

-- Policy: Allow doctors to upload their own credentials
CREATE POLICY "Doctors can upload their own credentials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow doctors to view their own credentials
CREATE POLICY "Doctors can view their own credentials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow doctors to update their own credentials
CREATE POLICY "Doctors can update their own credentials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow doctors to delete their own credentials
CREATE POLICY "Doctors can delete their own credentials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICATION QUERIES (Optional - for checking)
-- ============================================

-- Check if buckets were created
-- SELECT * FROM storage.buckets WHERE id IN ('doctor-photos', 'doctor-credentials');

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%doctor%';
