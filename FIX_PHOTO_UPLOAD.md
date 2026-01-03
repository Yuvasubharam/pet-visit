# 🔧 Fix Profile Photo Upload Issue

## Problem
**Error**: `StorageApiError: Bucket not found`

The storage buckets for doctor photos and credentials don't exist in your Supabase project.

---

## ✅ Solution: Run This SQL (2 minutes)

### Step 1: Copy the SQL Code

Open the file: **`CREATE_STORAGE_BUCKETS.sql`**

Or copy this:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-credentials', 'doctor-credentials', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for doctor-photos (public bucket)
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

-- Policies for doctor-credentials (private bucket)
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

### Step 2: Run in Supabase

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Click "SQL Editor"** (left sidebar)
3. **Click "+ New query"**
4. **Paste the SQL code** from above
5. **Click "RUN"** button
6. **Wait for "Success"** message

### Step 3: Verify (Optional)

You can verify the buckets were created:

1. Go to **Storage** in Supabase dashboard
2. You should see two new buckets:
   - ✅ **doctor-photos** (public)
   - ✅ **doctor-credentials** (private)

### Step 4: Test Photo Upload

1. Go to your app
2. Login as a doctor
3. Go to Profile Setup page
4. Click "Upload Photo"
5. Select an image
6. ✅ Should upload successfully now!

---

## 📋 What This Creates

### 1. **doctor-photos** Bucket (Public)
- Stores doctor profile photos
- **Public read access** - anyone can view photos
- **Authenticated doctors can**:
  - Upload their own photos
  - Update their own photos
  - Delete their own photos
- File structure: `{doctor_id}/profile.{ext}`

### 2. **doctor-credentials** Bucket (Private)
- Stores doctor credentials/certificates
- **Private** - only owner can access
- **Authenticated doctors can**:
  - Upload their own credentials
  - View their own credentials
  - Update their own credentials
  - Delete their own credentials
- File structure: `{doctor_id}/credentials.{ext}`

---

## 🔒 Security Features

1. ✅ **Folder-level isolation**: Each doctor can only access their own folder
2. ✅ **Authentication required**: Only logged-in users can upload
3. ✅ **Owner-only access**: Doctors can only modify their own files
4. ✅ **Public photos**: Profile photos are publicly viewable (for patient UI)
5. ✅ **Private credentials**: Credentials are only visible to the owner

---

## 🎯 File Upload Flow

### Profile Photo Upload:
```
User selects photo
    ↓
App uploads to: doctor-photos/{doctor_id}/profile.{ext}
    ↓
Supabase returns public URL
    ↓
App updates doctors table: profile_photo_url = public URL
    ↓
Photo displays in app ✨
```

### Credentials Upload:
```
User selects file
    ↓
App uploads to: doctor-credentials/{doctor_id}/credentials.{ext}
    ↓
Supabase returns URL (only accessible by owner)
    ↓
App updates doctors table: credentials_url = URL
    ↓
Admin can verify credentials 👨‍⚕️
```

---

## 🆘 Troubleshooting

### Error: "Bucket not found"
**Status**: ❌ SQL migration not run yet
**Fix**: Run the SQL code (see Step 1 & 2 above)

### Error: "new row violates row-level security policy"
**Status**: ❌ User not authenticated
**Fix**: Make sure user is logged in before uploading

### Error: "Permission denied"
**Status**: ❌ Trying to upload to another doctor's folder
**Fix**: Each doctor can only upload to their own folder (automatic)

### Photo uploads but doesn't display
**Status**: ⚠️ Cache issue
**Fix**: Hard refresh (Ctrl+Shift+R)

### Credentials upload successful but can't view
**Status**: ✅ This is correct! Credentials are private
**Fix**: Only the doctor who uploaded can view them

---

## 📊 Database Schema Reference

After running the SQL, your storage will have:

```
storage.buckets:
├── doctor-photos (public: true)
└── doctor-credentials (public: false)

storage.objects:
├── doctor-photos/
│   ├── {doctor_id_1}/profile.jpg
│   ├── {doctor_id_2}/profile.png
│   └── ...
└── doctor-credentials/
    ├── {doctor_id_1}/credentials.pdf
    ├── {doctor_id_2}/credentials.jpg
    └── ...
```

---

## ✅ Success Checklist

After running the SQL:

- [ ] Ran SQL code in Supabase SQL Editor
- [ ] Saw "Success" message
- [ ] Buckets visible in Storage section
- [ ] Refreshed app (Ctrl+Shift+R)
- [ ] Can upload profile photo
- [ ] Photo displays in profile
- [ ] Can upload credentials (optional)
- [ ] No more "Bucket not found" errors

---

## 🎉 That's It!

**Total time**: < 2 minutes
**Files to run**: Just the SQL migration
**Result**: Working photo & credentials upload 📸

---

**Last Updated**: December 31, 2025
**Status**: ✅ Ready to Deploy
**Action Required**: Run SQL migration
