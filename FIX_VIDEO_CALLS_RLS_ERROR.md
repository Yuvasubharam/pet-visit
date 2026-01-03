# 🔧 Fix Video Calls RLS Error

## The Problem

You're seeing this error:
```
ERROR: new row violates row-level security policy for table "call_notifications"
```

**Root Cause**: When a video call is created, a trigger automatically tries to create notifications, but RLS policies are blocking it because triggers run with the user's permissions by default.

---

## ✅ The Solution

I've created a **complete setup script** that fixes all issues:

### **File**: `supabase/VIDEO_CALLS_COMPLETE_SETUP.sql`

This script:
1. ✅ Creates all tables (if they don't exist)
2. ✅ Drops and recreates triggers (fixes "trigger already exists" error)
3. ✅ Uses `SECURITY DEFINER` on functions (bypasses RLS for system operations)
4. ✅ Cleans up and recreates all RLS policies
5. ✅ Grants proper permissions
6. ✅ **Safe to run multiple times** (idempotent)

---

## 🚀 How to Apply the Fix

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://supabase.com/dashboard
2. Click on your project: `kfnsqbgwqltbltngwbdh`

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"**

### Step 3: Run the Complete Setup Script
1. Open the file: `supabase/VIDEO_CALLS_COMPLETE_SETUP.sql`
2. Copy the **entire contents**
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 4: Verify Success
You should see:
```
✅ Video Calls Setup Complete!
📋 Tables created: video_calls, call_participants, call_events, call_notifications
🔒 RLS policies applied
⚡ Triggers configured
🎯 Ready to use!
```

---

## 🔍 What Changed

### Key Fixes:

#### 1. **SECURITY DEFINER on Functions**
The critical change - functions now run with elevated permissions:

```sql
CREATE OR REPLACE FUNCTION create_call_notification(...)
RETURNS UUID
SECURITY DEFINER  -- ← This bypasses RLS!
SET search_path = public
AS $$
...
```

This allows the trigger to create notifications even though regular users can't insert into `call_notifications` directly.

#### 2. **Proper INSERT Policies for video_calls**
Added missing INSERT policies:

```sql
CREATE POLICY "Users can insert their calls"
  ON video_calls FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Doctors can insert their calls"
  ON video_calls FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );
```

#### 3. **Clean Policy Reset**
The script now:
- Drops all existing policies first
- Recreates them with correct permissions
- No conflicts or duplicates

---

## 🧪 Test After Applying

### Test 1: Create a Video Call (Customer)
1. Login as a customer
2. Go to "My Bookings"
3. Click "Join Consultation" on an online booking
4. Should navigate to LiveConsultation without errors

### Test 2: Create a Video Call (Doctor)
1. Login as a doctor
2. Go to "Consultations"
3. Click "Join Call" on an online consultation
4. Should navigate to LiveConsultation without errors

### Test 3: Check Database
1. Go to Supabase Dashboard → Table Editor
2. Open `video_calls` table
3. You should see the created video call record
4. Open `call_notifications` table
5. You should see 2 notifications (one for doctor, one for customer)

---

## ❓ If You Still See Errors

### Error: "relation 'video_calls' does not exist"
- The table wasn't created. Make sure you ran the script in the correct database.
- Check you're in the **public** schema

### Error: "permission denied for table"
- Run this additional grant:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Error: "function already exists"
- Normal! The script uses `CREATE OR REPLACE` so it will update existing functions.

---

## 📋 What Happens Now

### When a Video Call is Created:

1. **User/Doctor** calls `videoCallService.createVideoCall()`
2. **INSERT** into `video_calls` table (✅ allowed by RLS policy)
3. **TRIGGER** `video_call_created_notification` fires
4. **FUNCTION** `notify_on_call_created()` runs with `SECURITY DEFINER`
5. **FUNCTION** calls `create_call_notification()` (also `SECURITY DEFINER`)
6. **NOTIFICATIONS** are inserted (✅ bypasses RLS because of `SECURITY DEFINER`)
7. **SUCCESS!** ✅

### Security:
- ✅ Regular users still can't directly insert into `call_notifications`
- ✅ Only the trigger (system function) can create notifications
- ✅ Users can only view their own calls and notifications
- ✅ Doctors can only view their assigned calls

---

## 🎯 Summary

| Issue | Status |
|-------|--------|
| Trigger already exists | ✅ Fixed (DROP IF EXISTS) |
| RLS blocking notifications | ✅ Fixed (SECURITY DEFINER) |
| Missing INSERT policies | ✅ Fixed (Added policies) |
| 403 Forbidden on video_calls | ✅ Fixed (Proper permissions) |

---

## 📚 Files Modified/Created

- ✅ `supabase/VIDEO_CALLS_COMPLETE_SETUP.sql` - **Run this!**
- 📖 `FIX_VIDEO_CALLS_RLS_ERROR.md` - This guide
- 📝 `VIDEO_CALL_NAVIGATION_COMPLETE.md` - Navigation implementation
- 📝 `AGORA_IMPLEMENTATION_COMPLETE.md` - Full feature guide

---

**Ready to fix? Run the script now!** 🚀
