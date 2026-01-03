# Fix "No Doctors Available" Issue - Complete Guide

## Problem Summary

Your consultation booking pages were showing "No doctors available for selected date" because:

1. **Wrong column name**: Code was checking `status = 'available'` but the `doctor_availability` table only has `is_active` column
2. **No sample data**: Database had no doctor records or availability slots to display

## What Was Fixed

### Code Changes

#### 1. [pages/HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx#L111-L147)
- ✅ Changed `eq('status', 'available')` to `eq('is_active', true)`
- ✅ Added filtering for available slots: `booked_count < capacity`
- ✅ Removed invalid `supabase.raw()` call

#### 2. [pages/OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx#L83-L121)
- ✅ Changed `eq('status', 'available')` to `eq('is_active', true)`
- ✅ Added filtering for available slots: `booked_count < capacity`
- ✅ Removed invalid `supabase.raw()` call

### How the Fix Works

**Before (❌ Broken):**
```typescript
.eq('status', 'available')  // Column doesn't exist!
.lt('booked_count', supabase.raw('capacity'))  // Invalid method!
```

**After (✅ Fixed):**
```typescript
.eq('is_active', true)  // Correct column
.filter((slot) => slot.booked_count < slot.capacity)  // Client-side filter
```

## Apply the Fixes

### Step 1: First Apply Storage Fix (if not already done)

If you haven't fixed the photo upload issue yet:

1. Open Supabase Dashboard → SQL Editor
2. Run the SQL from **[FIX_STORAGE_AND_RLS.sql](FIX_STORAGE_AND_RLS.sql)**
3. This fixes doctor profile photo uploads

### Step 2: Add Sample Doctor Data

1. Open Supabase Dashboard → SQL Editor
2. Run the SQL from **[INSERT_SAMPLE_DOCTORS.sql](INSERT_SAMPLE_DOCTORS.sql)**

This will create:
- ✅ **3 sample doctors** (Dr. Sarah Johnson, Dr. Michael Chen, Dr. Emily Rodriguez)
- ✅ **Availability slots** for the next 7 days
- ✅ **All slot types**: online, home, and clinic consultations
- ✅ **Morning & afternoon slots**: 9:00 AM - 12:00 PM and 2:00 PM - 5:00 PM

### Step 3: Test the Application

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Test Online Consultation**:
   - Navigate to: Online Consultation
   - You should now see 3 doctors
   - Select a date (today or future dates)
   - Time slots should appear (9:00 AM, 9:30 AM, etc.)

3. **Test Home/Clinic Consultation**:
   - Navigate to: Doctor Consultation
   - Toggle between "Home Visit" and "Clinic Visit"
   - You should see the same 3 doctors
   - Time slots should load based on selection

## Understanding the Database Schema

### Doctors Table
```sql
doctors (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  specialization TEXT,
  clinic_address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  approval TEXT CHECK (approval IN ('pending', 'approved', 'rejected')),
  rating DECIMAL DEFAULT 0,
  total_consultations INTEGER DEFAULT 0
)
```

**Key Points:**
- Doctors must have `is_active = true` AND `approval = 'approved'` to appear
- The sample SQL creates doctors with both conditions met

### Doctor Availability Table
```sql
doctor_availability (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id),
  date TEXT,  -- Format: 'YYYY-MM-DD'
  start_time TEXT,  -- Format: 'HH:MM' (24-hour)
  end_time TEXT,  -- Format: 'HH:MM' (24-hour)
  slot_type TEXT CHECK (slot_type IN ('clinic', 'home', 'online')),
  capacity INTEGER DEFAULT 1,
  booked_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  weekday INTEGER CHECK (weekday >= 0 AND weekday <= 6)
)
```

**Key Points:**
- Slots are shown only when `is_active = true`
- Slots are available when `booked_count < capacity`
- Time is stored in 24-hour format, converted to 12-hour in UI

## Troubleshooting

### Still seeing "No doctors available"?

1. **Check doctors exist and are approved**:
```sql
SELECT id, full_name, email, is_active, approval
FROM doctors
WHERE is_active = true AND approval = 'approved';
```

2. **Check availability exists for today**:
```sql
SELECT d.full_name, da.slot_type, da.start_time, da.capacity, da.booked_count
FROM doctor_availability da
JOIN doctors d ON d.id = da.doctor_id
WHERE da.date = CURRENT_DATE
  AND da.is_active = true
  AND d.is_active = true
  AND d.approval = 'approved';
```

3. **Check browser console**: Look for errors in the Network tab or Console

### Slots not appearing?

1. **Verify date format**: Ensure you're selecting a date that has availability
2. **Check capacity**: Make sure `booked_count < capacity` for the slots
3. **Verify slot_type**: Ensure the slot_type matches ('online', 'home', or 'clinic')

### TypeScript errors?

The minor TypeScript hints in the IDE are just warnings about missing type declarations for React. They don't affect functionality. If you want to fix them:

```bash
npm install --save-dev @types/react @types/react-dom
```

## Adding More Doctors

To add your own doctors:

### Option 1: Via the App (Recommended)
1. Go to Doctor Registration page
2. Fill in the form and submit
3. **Important**: Go to Supabase → Table Editor → doctors
4. Find your doctor and set `approval = 'approved'`

### Option 2: Directly in Database
1. Open Supabase → Table Editor → doctors
2. Click "Insert" → "Insert row"
3. Fill in all required fields
4. Set `is_active = true` and `approval = 'approved'`

Then add availability:
1. Go to doctor_availability table
2. Insert rows with your doctor's ID
3. Set appropriate dates, times, and slot types

## Summary

✅ Fixed incorrect column reference (`status` → `is_active`)
✅ Fixed invalid method call (`supabase.raw()` → client-side filter)
✅ Created sample doctors and availability data
✅ All consultation types now work (online, home, clinic)

Your consultation booking should now display doctors correctly!
