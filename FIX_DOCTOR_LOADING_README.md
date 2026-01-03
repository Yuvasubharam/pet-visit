# Fix Doctor Loading Issue - Complete Guide

## Problem Summary

Doctors were not loading in the booking pages ([HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx), [OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx)) due to a **schema mismatch** between the database and application code.

### Root Cause

1. **Missing `approval` column**: The application code in [doctorApi.ts:189](services/doctorApi.ts#L189) was querying for `approval = 'approved'`, but this column didn't exist in the initial database schema.
2. **Missing `clinic_name` column**: Needed for better display of clinic information.
3. **Missing location columns**: `clinic_latitude` and `clinic_longitude` were not in the initial schema.
4. **Restrictive RLS policy**: The policy required doctors to be both `is_active` AND `is_verified`, which may have been too strict.

## Solution Implemented

### 1. Database Migration
Created [007_add_approval_and_clinic_name.sql](supabase/migrations/007_add_approval_and_clinic_name.sql) which adds:
- `approval` column (TEXT, default 'pending', CHECK constraint for 'pending'|'approved'|'rejected')
- `clinic_name` column (TEXT, nullable)
- `clinic_latitude` column (DECIMAL(10,8), nullable)
- `clinic_longitude` column (DECIMAL(11,8), nullable)
- Indexes for better performance
- Updated RLS policies

### 2. API Service Improvements
Updated [doctorApi.ts](services/doctorApi.ts):
- Removed hard dependency on `approval` column in the query
- Added filtering in JavaScript to handle legacy data (doctors without approval field)
- Added comprehensive console logging for debugging
- Made the function more resilient to schema changes

### 3. UI Improvements
Updated [HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx):
- Added dynamic map display based on doctor's clinic location
- Shows actual clinic coordinates when available for clinic visits
- Added detailed error logging for troubleshooting
- Better handling of missing doctor data

Updated [OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx):
- Added comprehensive error logging
- Better error messages in console

## How to Apply the Fix

### Option 1: Run the Complete Fix Script (Recommended)

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of **[FIX_DOCTOR_LOADING.sql](FIX_DOCTOR_LOADING.sql)**
4. Click "Run"
5. Check the output messages for verification

This script will:
- ✅ Add all missing columns
- ✅ Create necessary indexes
- ✅ Update existing doctors to 'approved' status
- ✅ Fix RLS policies
- ✅ Display verification information
- ✅ Show all doctors and their availability

### Option 2: Run the Migration File

If you're using Supabase migrations:

```bash
# Apply the migration
supabase db push

# Or if you're using manual migrations
# Run the file in Supabase SQL Editor:
# supabase/migrations/007_add_approval_and_clinic_name.sql
```

## Verification Steps

After running the fix:

1. **Check the Console Logs**
   - Open your browser's Developer Tools (F12)
   - Go to the Console tab
   - Navigate to any booking page
   - Look for log messages starting with:
     - `[getAvailableDoctors]`
     - `[HomeConsultBooking]`
     - `[OnlineConsultBooking]`

2. **Expected Log Output**
   ```
   [HomeConsultBooking] Loading doctors for: {slotType: "home", dateStr: "2026-01-01"}
   [getAvailableDoctors] Fetching doctors for: {slot_type: "home", dateStr: "2026-01-01"}
   [getAvailableDoctors] Found doctors: 3
   [getAvailableDoctors] Approved doctors: 3
   [getAvailableDoctors] Available slots found: 12
   [getAvailableDoctors] Doctors with availability: 2
   [HomeConsultBooking] Doctors loaded: 2
   ```

3. **Verify in Database**
   Run this query in Supabase SQL Editor:
   ```sql
   -- Check doctors and their availability
   SELECT
     d.full_name,
     d.approval,
     d.is_active,
     d.clinic_name,
     COUNT(da.id) as slots
   FROM doctors d
   LEFT JOIN doctor_availability da
     ON d.id = da.doctor_id
     AND da.is_active = TRUE
     AND da.date >= CURRENT_DATE
   WHERE d.is_active = TRUE
   GROUP BY d.id, d.full_name, d.approval, d.is_active, d.clinic_name;
   ```

## Common Issues and Solutions

### Issue 1: "No doctors available for selected date"

**Possible Causes:**
1. No doctors in the database
2. Doctors exist but have no availability slots
3. All slots are fully booked

**Solution:**
```sql
-- Check if doctors exist
SELECT COUNT(*) FROM doctors WHERE is_active = TRUE;

-- If 0, run INSERT_SAMPLE_DOCTORS.sql to add sample doctors

-- Check if doctors have availability
SELECT COUNT(*) FROM doctor_availability
WHERE is_active = TRUE AND date >= CURRENT_DATE;

-- If 0, create availability slots using the Doctor Portal
-- or run QUICK_TEST_DATA.sql for sample data
```

### Issue 2: Error in console about approval column

**Solution:**
Make sure you ran [FIX_DOCTOR_LOADING.sql](FIX_DOCTOR_LOADING.sql) completely.

Check if the column exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'doctors' AND column_name = 'approval';
```

### Issue 3: Doctors appear but no time slots

**Possible Causes:**
1. Doctor has availability but all slots are booked
2. Availability is set for a different date
3. Availability is set for a different slot_type

**Solution:**
Check doctor availability:
```sql
SELECT
  d.full_name,
  da.date,
  da.start_time,
  da.slot_type,
  da.capacity,
  da.booked_count
FROM doctors d
JOIN doctor_availability da ON d.id = da.doctor_id
WHERE d.is_active = TRUE
  AND da.is_active = TRUE
  AND da.date >= CURRENT_DATE
ORDER BY da.date, da.start_time;
```

### Issue 4: Clinic map not showing correct location

**Solution:**
1. Ensure doctors have `clinic_latitude` and `clinic_longitude` set:
   ```sql
   UPDATE doctors
   SET
     clinic_latitude = 28.6139,  -- Example: New Delhi
     clinic_longitude = 77.2090,
     clinic_name = 'Pet Care Clinic'
   WHERE id = 'your-doctor-id';
   ```

2. Verify the coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

## Testing Checklist

After applying the fix, test all three booking types:

- [ ] **Online Consultation**
  - Navigate to Online Consultation page
  - Select a date
  - Verify doctors appear
  - Verify time slots appear
  - Check console for any errors

- [ ] **Home Visit Consultation**
  - Navigate to Home Visit page
  - Select a date
  - Verify doctors appear
  - Verify time slots appear
  - Verify home address shows on map
  - Check console for any errors

- [ ] **Clinic Visit Consultation**
  - Navigate to Clinic Visit page
  - Select a date
  - Verify doctors appear
  - Verify time slots appear
  - **Verify clinic location shows on map** (NEW!)
  - **Verify clinic name displays correctly** (NEW!)
  - Check console for any errors

## File Changes Summary

### Modified Files:
1. ✅ [services/doctorApi.ts](services/doctorApi.ts#L177-L237) - Made getAvailableDoctors more resilient
2. ✅ [pages/HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx#L92-L115) - Added logging and clinic map
3. ✅ [pages/OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx#L64-L87) - Added logging

### New Files:
1. ✅ [supabase/migrations/007_add_approval_and_clinic_name.sql](supabase/migrations/007_add_approval_and_clinic_name.sql) - Database migration
2. ✅ [FIX_DOCTOR_LOADING.sql](FIX_DOCTOR_LOADING.sql) - Complete fix script with verification
3. ✅ [FIX_DOCTOR_LOADING_README.md](FIX_DOCTOR_LOADING_README.md) - This file

### Existing Type Definitions:
- ✅ [types.ts](types.ts#L135) - Already had `approval` field defined
- ✅ [types.ts](types.ts#L134) - Already had `clinic_name` field defined
- ✅ [types.ts](types.ts#L123-L124) - Already had location fields defined

## Architecture Notes

### Data Flow for Doctor Loading:

```
User selects date/visit type
    ↓
Component calls loadDoctors()
    ↓
doctorAuthService.getAvailableDoctors({slot_type, date})
    ↓
Query 1: Fetch all active doctors from database
    ↓
Filter in JavaScript: Keep only approved doctors
    ↓
Query 2: Fetch availability for date/slot_type
    ↓
Match doctors with availability
    ↓
Return only doctors that have available slots
    ↓
Component displays doctor list
```

### Why This Approach?

1. **Resilient to Schema Changes**: Filtering in JavaScript allows handling doctors without approval field
2. **Better Error Reporting**: Comprehensive logging at each step
3. **Backward Compatible**: Works with existing data
4. **Performance**: Uses database indexes for fast queries
5. **Separation of Concerns**: Database for storage, JavaScript for business logic

## Production Recommendations

1. **Remove Permissive RLS Policy**: In [007_add_approval_and_clinic_name.sql](supabase/migrations/007_add_approval_and_clinic_name.sql#L72-L79), there are two policies. Remove the permissive one in production:
   ```sql
   DROP POLICY "Anyone can view all active doctors for testing" ON doctors;
   ```

2. **Require Verification**: Update the policy to require verification:
   ```sql
   CREATE POLICY "Anyone can view active verified doctors" ON doctors
     FOR SELECT USING (is_active = TRUE AND is_verified = TRUE AND approval = 'approved');
   ```

3. **Add Monitoring**: Set up alerts for when doctors have no availability

4. **Regular Cleanup**: Archive old availability slots to improve query performance

## Support

If you still see issues after applying this fix:

1. Check the browser console for detailed error logs
2. Run the verification queries in the SQL script
3. Ensure you have at least one doctor with:
   - `is_active = TRUE`
   - `approval = 'approved'`
   - At least one availability slot for today or future dates
4. Verify the availability slot has `capacity > booked_count`

## Additional Resources

- [INSERT_SAMPLE_DOCTORS.sql](INSERT_SAMPLE_DOCTORS.sql) - Sample doctor data
- [QUICK_TEST_DATA.sql](QUICK_TEST_DATA.sql) - Sample availability data
- [Doctor Portal](pages/DoctorAvailability.tsx) - UI for managing availability
