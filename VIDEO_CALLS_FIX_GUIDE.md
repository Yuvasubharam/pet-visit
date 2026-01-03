# 🔧 Complete Video Call Fix Guide

## Current Status: 2 Issues to Fix

Your video call integration has **2 separate issues** that need to be fixed:

---

## ❌ Issue #1: Database RLS Error (FIXED - Needs to be Applied)

### Error Message:
```
new row violates row-level security policy for table "call_notifications"
```

### ✅ Solution: Run SQL Script
**File**: `supabase/VIDEO_CALLS_COMPLETE_SETUP.sql`

**How to Apply**:
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Open **SQL Editor**
3. Copy contents of `VIDEO_CALLS_COMPLETE_SETUP.sql`
4. Paste and click **Run**
5. ✅ Done!

**What This Fixes**:
- ✅ Allows video call records to be created
- ✅ Enables automatic notifications
- ✅ Uses `SECURITY DEFINER` to bypass RLS for system operations
- ✅ Creates all necessary tables and policies

**Details**: See [FIX_VIDEO_CALLS_RLS_ERROR.md](FIX_VIDEO_CALLS_RLS_ERROR.md)

---

## ❌ Issue #2: Agora Authentication Error (NEEDS ACTION)

### Error Message:
```
AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: dynamic use static key
```

### ✅ Solution: Enable Testing Mode in Agora Console

**Quick Fix**:
1. Go to https://console.agora.io/
2. Select your project (App ID: `4644112ab7454526badea7d34c7a1d59`)
3. Find **"App Certificate"** or **"Testing Mode"**
4. **DISABLE App Certificate** or **ENABLE Testing Mode**
5. Save changes
6. Refresh your app

**What This Fixes**:
- ✅ Allows Agora to connect without token authentication
- ✅ Perfect for development and testing
- ✅ No backend token server needed

**Details**: See [ENABLE_AGORA_TESTING_MODE.md](ENABLE_AGORA_TESTING_MODE.md)

---

## 🚀 Complete Fix Steps (In Order)

### Step 1: Fix Database (5 minutes)
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run VIDEO_CALLS_COMPLETE_SETUP.sql
4. Wait for success message
```

### Step 2: Enable Agora Testing Mode (2 minutes)
```
1. Open Agora Console
2. Go to your project
3. Disable App Certificate OR Enable Testing Mode
4. Save
```

### Step 3: Test the Integration (2 minutes)
```
1. Refresh your app in browser
2. Login as doctor
3. Click "Join Call" on online consultation
4. Grant camera/microphone permissions
5. ✅ Should connect successfully!
```

---

## 🎯 What You'll See After Fixes

### Before Fixes:
```
❌ 403 Forbidden on video_calls
❌ RLS policy violation
❌ CAN_NOT_GET_GATEWAY_SERVER error
❌ Failed to connect to call
```

### After Fixes:
```
✅ Video call record created in database
✅ Notifications created for doctor and customer
✅ Agora connects successfully
✅ Local video displays
✅ Remote user can join
✅ Both parties see each other's video
```

---

## 📊 Summary Table

| Issue | Type | Severity | Fix Required | Time | Status |
|-------|------|----------|--------------|------|--------|
| RLS Policy Error | Database | High | Run SQL Script | 5 min | ✅ Script Ready |
| Agora Auth Error | API | High | Enable Testing Mode | 2 min | ⚠️ Action Needed |
| Navigation | Code | Fixed | Already Done | - | ✅ Complete |

---

## ✅ You're Almost There!

Just **2 quick actions**:

1. ⚡ **Run SQL script** in Supabase (5 min)
   - File: `supabase/VIDEO_CALLS_COMPLETE_SETUP.sql`

2. ⚡ **Enable testing mode** in Agora (2 min)
   - Go to: https://console.agora.io/
   - Disable App Certificate

Then your video calls will be **fully functional**! 🎥✨

**Happy Video Calling! 🐾**
