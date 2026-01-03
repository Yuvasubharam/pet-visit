# Pending Approvals Testing Guide

## Current Status
The "Pending Approvals" section in DoctorDashboard is implemented but only shows when there are bookings with:
- `doctor_id` matches the logged-in doctor
- `status = 'pending'`

## Why It's Not Showing

The section is conditionally rendered (line 271):
```typescript
{pendingBookings.length > 0 && (
  <section>... Pending Approvals ...</section>
)}
```

If you don't see it, it means there are NO pending bookings.

## How to Test

### Step 1: Create a Booking with Pending Status

When a user books a consultation and selects a specific doctor, the booking should be created with `status = 'pending'`.

**Check the booking creation in the database:**

```sql
-- Run this in Supabase SQL Editor
SELECT
  id,
  doctor_id,
  status,
  booking_type,
  date,
  time,
  created_at
FROM bookings
WHERE doctor_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Step 2: Verify the Status

Bookings should have:
- ✅ `doctor_id` = a valid doctor ID
- ✅ `status` = 'pending' (NOT 'upcoming')

### Step 3: Manual Test

If no pending bookings exist, create one manually:

```sql
-- Create a test pending booking
INSERT INTO bookings (
  user_id,
  pet_id,
  service_type,
  booking_type,
  date,
  time,
  doctor_id,
  status,
  payment_status,
  payment_amount
) VALUES (
  '<your-user-id>',
  '<your-pet-id>',
  'consultation',
  'home',
  '2026-01-05',
  '10:00 AM',
  '<your-doctor-id>',
  'pending',
  'pending',
  500
);
```

### Step 4: Check Doctor Dashboard

After creating a pending booking:
1. Log in as the doctor
2. Go to Doctor Dashboard
3. You should see "Pending Approvals" section below "UPCOMING CONSULTATIONS"

## Debugging Steps

### Check Console Logs

Open browser console and look for:
```
[DoctorDashboard] Bookings filtered:
- pending: X bookings
```

### Add Debug Logging

Temporarily add this to DoctorDashboard.tsx after line 91:

```typescript
setPendingBookings(pending);
console.log('[DoctorDashboard] Pending bookings count:', pending.length);
console.log('[DoctorDashboard] Pending bookings:', pending);
```

## Common Issues

### Issue 1: Bookings Created with 'upcoming' Status
**Problem**: The booking creation logic might be setting status to 'upcoming' instead of 'pending'

**Fix**: Check `services/api.ts` line 392:
```typescript
status: bookingData.doctorId ? 'pending' : 'upcoming',
```

### Issue 2: Doctor Not Logged In
**Problem**: `doctorId` is null

**Solution**: Ensure you're logged in as a doctor, not a regular user

### Issue 3: No Doctor Selected During Booking
**Problem**: User didn't select a doctor, so `doctor_id` is null

**Solution**: When booking, make sure to select a specific doctor from the list

## Expected Flow

### User Side:
1. User selects a doctor from the list
2. User proceeds to checkout
3. User completes payment
4. Booking created with:
   - `doctor_id` = selected doctor's ID
   - `status` = 'pending'

### Doctor Side:
1. Doctor logs into dashboard
2. Sees "Pending Approvals" section (if pending bookings exist)
3. Clicks "Accept" → booking status changes to 'upcoming'
4. Booking moves to "Upcoming Consultations" section

## Verification Queries

### Check if Pending Bookings Exist
```sql
SELECT COUNT(*) as pending_count
FROM bookings
WHERE status = 'pending'
AND doctor_id IS NOT NULL;
```

### Check Specific Doctor's Pending Bookings
```sql
SELECT
  b.id,
  b.doctor_id,
  b.status,
  b.booking_type,
  b.date,
  b.time,
  p.name as pet_name,
  d.full_name as doctor_name
FROM bookings b
LEFT JOIN pets p ON b.pet_id = p.id
LEFT JOIN doctors d ON b.doctor_id = d.id
WHERE b.doctor_id = '<your-doctor-id>'
AND b.status = 'pending'
ORDER BY b.created_at DESC;
```

## Force Show Section (For Testing)

If you want to temporarily see the section regardless of data, change line 271 to:

```typescript
{(pendingBookings.length > 0 || true) && (
```

This will show the section even with no data (but will cause an error when trying to display booking details).

## Summary

The "Pending Approvals" section IS implemented correctly. It just needs pending bookings to display. The most likely reason it's not showing is:

1. ✅ Code is correct
2. ❌ No bookings with `status = 'pending'` exist in the database

Create a test booking with the SQL above, or book a consultation through the app while selecting a specific doctor.
