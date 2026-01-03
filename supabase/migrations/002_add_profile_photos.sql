-- Add profile_photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Storage policies for pet photos
CREATE POLICY "Users can upload their own pet photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own pet photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own pet photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Pet photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pet-photos');
