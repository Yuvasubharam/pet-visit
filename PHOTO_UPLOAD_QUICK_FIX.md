# ⚡ Quick Fix: Profile Photo Upload Error

## Error You're Seeing
```
StorageApiError: Bucket not found
Failed to load resource: the server responded with a status of 400
```

---

## ✅ The Fix (Copy & Paste This SQL)

### Step 1: Copy This SQL
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-credentials', 'doctor-credentials', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for doctor-photos
CREATE POLICY "Public can view doctor photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-photos');

CREATE POLICY "Doctors can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies for doctor-credentials
CREATE POLICY "Doctors can upload their own credentials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can view their own credentials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can update their own credentials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can delete their own credentials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-credentials'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 2: Run It
1. Go to **https://supabase.com/dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **+ New query**
4. **Paste** the SQL above
5. Click **RUN**
6. Wait for **Success** ✓

### Step 3: Test
1. Refresh your app (Ctrl+Shift+R)
2. Go to Doctor Profile Setup
3. Upload a photo
4. ✅ Should work now!

---

## What This Does

Creates 2 storage buckets:
- **doctor-photos** - Public (anyone can view, owners can upload)
- **doctor-credentials** - Private (only owner can access)

---

## Files Fixed

✅ [OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx) - Fixed profile_photo field
✅ [HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx) - Fixed profile_photo field
✅ [ConfirmationOnline.tsx](pages/ConfirmationOnline.tsx) - Fixed profile_photo field

---

**That's it!** Just run the SQL and you're done. 🎉
