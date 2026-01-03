# Fix Photo Upload Errors - Instructions

## Errors Being Fixed

Your application is experiencing these errors:
- ❌ **406 Error**: Not Acceptable on photo upload
- ❌ **409 Error**: Conflict on users table query
- ❌ **400 Error**: Bad request on storage object access
- ❌ **RLS Policy Violation**: "new row violates row-level security policy"

## Root Causes

1. **Storage RLS Mismatch**: The storage policies in `CREATE_STORAGE_BUCKETS.sql` expect files organized by `auth.uid()`, but your code uses `doctor.id` for folder structure
2. **Missing Helper Function**: No function to verify doctor ownership when using `doctor_id` instead of `user_id`
3. **Overly Restrictive Policies**: Doctor table policies preventing profile updates

## Solution - Apply SQL Fix

### Step 1: Run the Comprehensive Fix

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open and run the file: **`FIX_STORAGE_AND_RLS.sql`**

This will:
- ✅ Create/update storage buckets with correct settings
- ✅ Add a helper function to check doctor ownership
- ✅ Set up proper RLS policies for storage (using doctor_id)
- ✅ Fix doctor table RLS policies
- ✅ Allow authenticated users to upload photos

### Step 2: Verify the Fix

After running the SQL, you should see:

```
Buckets created:
- doctor-photos (public: true)
- doctor-credentials (public: false)

Storage policies created:
- Public can view doctor photos
- Doctors can upload their own photos
- Doctors can update their own photos
- Doctors can delete their own photos
- Doctors can upload their own credentials
- Doctors can view their own credentials
- Doctors can update their own credentials
- Doctors can delete their own credentials

Doctor table policies:
- Doctors can insert own profile
- Doctors can view own profile
- Doctors can update own profile
- Anyone can view active doctors
```

### Step 3: Test Photo Upload

1. Log in as a doctor
2. Go to Profile Setup
3. Try uploading a profile photo
4. Try uploading credentials

Both should work without errors.

## How the Fix Works

### Before (❌ Broken)
```typescript
// Storage policy expected: {auth.uid()}/profile.png
// Code was uploading to: {doctor.id}/profile.png
// Result: RLS policy violation
```

### After (✅ Fixed)
```sql
-- Helper function checks if auth.uid() owns the doctor profile
CREATE FUNCTION is_doctor_owner(doctor_id_from_path TEXT)
-- Policy uses this function to verify ownership
WHERE public.is_doctor_owner((storage.foldername(name))[1])
```

Now when you upload to `{doctor.id}/profile.png`, the policy:
1. Extracts `doctor.id` from the path
2. Checks if current `auth.uid()` owns that doctor record
3. Allows upload if true

## Additional Notes

### File Organization
- **Doctor Photos**: `doctor-photos/{doctor_id}/profile.{ext}` (public)
- **Credentials**: `doctor-credentials/{doctor_id}/credentials.{ext}` (private)

### Security
- Only authenticated users can upload
- Each doctor can only access their own files
- Public can view doctor photos (for patient browsing)
- Credentials remain private

### Troubleshooting

If you still see errors:

1. **Clear browser cache** and reload
2. **Check auth state**: Ensure user is logged in
3. **Verify doctor record exists**: Check that the doctor profile was created in the database
4. **Check network tab**: Look for specific error messages in browser console

Run this query to verify your doctor profile exists:
```sql
SELECT id, user_id, full_name, email
FROM doctors
WHERE user_id = auth.uid();
```

## Delete Old File

After applying this fix, you can delete:
- ❌ `CREATE_STORAGE_BUCKETS.sql` (replaced by `FIX_STORAGE_AND_RLS.sql`)
