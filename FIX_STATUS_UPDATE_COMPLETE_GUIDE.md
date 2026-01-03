# Complete Fix: Doctor Status Update Errors (400 & 403)

## Problem Summary

When doctors try to mark a consultation as "complete" from the **DoctorConsultationDetails** page, they encounter multiple errors:

```
❌ 400 Error: Failed to load resource: the server responded with a status of 400
❌ 403 Error: Failed to load resource: the server responded with a status of 403
```

Both errors appear at `DoctorConsultationDetails.tsx:224` when calling `handleUpdateStatus`.

---

## Root Causes

### 1. **400 Bad Request Error**

**Location**: `DoctorConsultationDetails.tsx:182`

**Issue**: The code tries to set `payment_status = 'cod'` (Cash on Delivery), but the database constraint only allows:
- `'pending'`
- `'paid'`
- `'failed'`

**Code**:
```typescript
if (booking.payment_status === 'pending' || booking.payment_status === 'failed') {
  updates.payment_status = 'cod'; // ❌ NOT ALLOWED
}
```

**Database Constraint**:
```sql
CHECK (payment_status IN ('pending', 'paid', 'failed'))
-- Missing 'cod' ❌
```

---

### 2. **403 Forbidden Error**

**Location**: `DoctorConsultationDetails.tsx:188-191`

**Issue**: The RLS (Row Level Security) policy on the `bookings` table prevents doctors from updating booking records, even when the booking is assigned to them.

**Current Policy**:
```sql
-- Only allows user (patient) to update their own bookings
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id)  -- ❌ Doctor's auth.uid() ≠ booking.user_id
```

When a doctor is logged in:
- `auth.uid()` = doctor's user_id
- `booking.user_id` = patient's user_id
- **Result**: Policy denies the update → 403 Forbidden

---

## Complete Solution

Run the SQL migration file: **COMPLETE_FIX_DOCTOR_UPDATE_STATUS.sql**

### What It Does

1. **Fixes 400 Error**: Adds `'cod'` to allowed `payment_status` values
2. **Fixes 403 Error**: Creates RLS policies allowing doctors to update their assigned bookings
3. **Bonus**: Allows doctors to accept unassigned consultation requests

---

## Step-by-Step Fix

### Option 1: Run Complete Fix (Recommended)

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor

2. **Copy and Paste** the contents of `COMPLETE_FIX_DOCTOR_UPDATE_STATUS.sql`

3. **Run the Migration**
   - Click "Run" or press Ctrl+Enter
   - You should see success messages

4. **Verify**
   - Check that policies were created
   - The verification queries will show all policies

---

### Option 2: Manual Step-by-Step

If you prefer to apply fixes one at a time:

#### Step 1: Fix Payment Status Constraint (400 Error)

```sql
-- Drop existing constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Add new constraint with 'cod'
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));
```

**Test**: Try marking a consultation complete. You should now get a **403** error instead of **400**.

#### Step 2: Fix Doctor Update Policy (403 Error)

```sql
-- Drop old policy
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;

-- Create new policy
CREATE POLICY "Doctors can update their assigned bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);
```

**Test**: Try marking a consultation complete. Should now work! ✅

---

## Testing the Fix

### Test Case 1: Mark Consultation as Complete

1. **Login as a doctor**
2. **Go to Doctor Dashboard** → Consultations
3. **Select a consultation** with status "upcoming"
4. **Click "Mark Complete"**
5. **Expected Result**:
   - ✅ Status updates to "completed"
   - ✅ Payment status updates to "cod" (if was pending/failed)
   - ✅ Earning record is created
   - ✅ No errors in console
   - ✅ Success alert appears

### Test Case 2: Cancel Consultation

1. **Select a consultation**
2. **Click "Cancel"**
3. **Expected Result**:
   - ✅ Status updates to "cancelled"
   - ✅ No errors

### Test Case 3: Accept Unassigned Booking

1. **Go to Pending Approvals tab**
2. **View an unassigned consultation request**
3. **Click "Accept"**
4. **Expected Result**:
   - ✅ Doctor gets assigned
   - ✅ Status updates to "upcoming"
   - ✅ No errors

---

## Verification Queries

After running the migration, verify everything is set up correctly:

### Check Payment Status Constraint

```sql
SELECT
  conname,
  pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND conname = 'bookings_payment_status_check';
```

**Expected Output**:
```
CHECK ((payment_status = ANY (ARRAY['pending', 'paid', 'failed', 'cod'])))
```

### Check Doctor Policies

```sql
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'bookings'
AND policyname LIKE '%Doctor%'
ORDER BY cmd, policyname;
```

**Expected Output**:
- `Doctors can view their assigned bookings` (SELECT)
- `Doctors can update their assigned bookings` (UPDATE)
- `Doctors can accept unassigned bookings` (UPDATE)

---

## What Changed

### Database Schema Changes

**Before**:
```sql
CHECK (payment_status IN ('pending', 'paid', 'failed'))
```

**After**:
```sql
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'))
```

### RLS Policies Added

1. **Doctors can view their assigned bookings**
   - Allows doctors to see bookings where `doctor_id` matches their ID
   - Also allows viewing unassigned bookings (`doctor_id IS NULL`)

2. **Doctors can update their assigned bookings**
   - Allows doctors to update status and payment_status
   - Only for bookings assigned to them

3. **Doctors can accept unassigned bookings**
   - Allows doctors to accept consultation requests
   - Only for unassigned consultations

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove 'cod' from constraint
ALTER TABLE bookings
DROP CONSTRAINT bookings_payment_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- Remove doctor policies
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can accept unassigned bookings" ON bookings;
```

---

## Files Modified

- ✅ Database: `bookings` table constraint
- ✅ Database: RLS policies for `bookings` table
- 📝 Code: No code changes needed! (DoctorConsultationDetails.tsx works as-is)

---

## Common Issues

### Issue: Still getting 403 error

**Cause**: Doctor not properly logged in or doctor record missing

**Fix**:
1. Check that the doctor is logged in
2. Verify doctor record exists in `doctors` table
3. Check that `user_id` in doctors table matches auth user

**Query to check**:
```sql
-- Replace with doctor's email
SELECT d.id, d.user_id, d.full_name, d.email
FROM doctors d
JOIN auth.users u ON u.id = d.user_id
WHERE d.email = 'doctor@example.com';
```

### Issue: Still getting 400 error

**Cause**: Migration didn't run completely

**Fix**: Re-run the constraint update:
```sql
ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));
```

---

## Summary

This fix resolves both errors:
- ✅ **400 Error**: Added 'cod' to payment_status allowed values
- ✅ **403 Error**: Created RLS policies for doctors to update bookings

After applying this migration, doctors can:
- ✅ Mark consultations as complete
- ✅ Cancel consultations
- ✅ Accept unassigned consultation requests
- ✅ Update payment status to COD for unpaid consultations

No code changes required - the existing code in `DoctorConsultationDetails.tsx` will work perfectly once the database is updated!
