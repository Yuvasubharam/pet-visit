# Debugging Guide: Upcoming Consultation Not Showing

## Quick Fix Steps

### Step 1: Apply RLS Policies
```bash
# Open Supabase Dashboard → SQL Editor
# Copy and paste the entire contents of:
FIX_BOOKINGS_RLS_POLICIES.sql
# Click "Run"
```

### Step 2: Check Browser Console
1. Open your app
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for logs starting with `[Home]`

**Expected logs:**
```
[Home] Loading upcoming booking for userId: xxx-xxx-xxx
[Home] Consultations fetched: 2
[Home] Groomings fetched: 1
[Home] Total bookings combined: 3
[Home] Booking date/time: 2026-01-15 14:30 - In future? true
[Home] Upcoming bookings after filter: 1
[Home] Setting upcoming booking: {id: "...", ...}
```

### Step 3: Troubleshoot Based on Console Output

#### Problem A: No bookings fetched
```
[Home] Consultations fetched: 0
[Home] Groomings fetched: 0
```

**Solution:**
1. RLS policies are blocking access
2. Run `FIX_BOOKINGS_RLS_POLICIES.sql`
3. Or check if user actually has bookings:
   ```sql
   SELECT * FROM bookings WHERE user_id = 'YOUR_USER_ID';
   ```

#### Problem B: Bookings fetched but all filtered out
```
[Home] Total bookings combined: 3
[Home] Booking filtered out - status: completed
[Home] Booking filtered out - status: pending
[Home] Upcoming bookings after filter: 0
```

**Solution:**
1. Bookings exist but status is not 'upcoming'
2. Update booking status:
   ```sql
   UPDATE bookings
   SET status = 'upcoming'
   WHERE id = 'YOUR_BOOKING_ID';
   ```

#### Problem C: Status is 'upcoming' but date is in the past
```
[Home] Booking date/time: 2025-12-01 10:00 - In future? false
```

**Solution:**
1. Booking date/time is in the past
2. Update to a future date:
   ```sql
   UPDATE bookings
   SET
     date = '2026-01-15',
     time = '14:30'
   WHERE id = 'YOUR_BOOKING_ID';
   ```

#### Problem D: No userId
```
[Home] No userId provided for upcoming booking
```

**Solution:**
1. User is not logged in
2. Check authentication state in App.tsx
3. Ensure userId prop is being passed to Home component

## Create Test Booking

If you have no bookings, create a test one:

```sql
-- Step 1: Get your user_id
SELECT id, name, email FROM users LIMIT 5;

-- Step 2: Get your pet_id
SELECT id, name FROM pets WHERE user_id = 'YOUR_USER_ID';

-- Step 3: Create upcoming booking
INSERT INTO bookings (
  user_id,
  pet_id,
  service_type,
  booking_type,
  date,
  time,
  status,
  payment_status,
  payment_amount,
  contact_number
) VALUES (
  'YOUR_USER_ID',
  'YOUR_PET_ID',
  'consultation',
  'online',
  '2026-01-15',
  '14:30',
  'upcoming',
  'paid',
  500.00,
  '1234567890'
);

-- Step 4: Verify it was created
SELECT
  id,
  service_type,
  booking_type,
  status,
  date,
  time
FROM bookings
WHERE user_id = 'YOUR_USER_ID'
AND status = 'upcoming'
ORDER BY date DESC;
```

## Visual Check

After fixing, you should see this in the Home page (between the header and Quick Services):

```
┌─────────────────────────────────────────┐
│  📹  UPCOMING VISIT                     │
│  Online Consultation for Max            │
│  Tomorrow, 2:30 PM                    ➤ │
└─────────────────────────────────────────┘
```

## What Each Part Does

### 1. Data Fetching (Lines 83-86)
```typescript
const [consultations, groomings] = await Promise.all([
    consultationService.getUserConsultationBookings(userId),
    groomingService.getUserGroomingBookings(userId)
]);
```
**Checks:**
- Does `getUserConsultationBookings()` return data?
- Does `getUserGroomingBookings()` return data?

### 2. Filtering (Lines 97-119)
```typescript
const upcomingBookings = allBookings.filter(booking => {
    if (booking.status !== 'upcoming') return false;
    const bookingDateTime = new Date(`${booking.date}T${timeStr}`);
    return bookingDateTime > now;
});
```
**Checks:**
- Is `status = 'upcoming'`?
- Is date/time in the future?

### 3. Display (Lines 213-227)
```tsx
{upcomingBooking ? (
    <div className="...upcoming visit card..." onClick={onBookingsClick}>
        ...
    </div>
) : null}
```
**Checks:**
- Is `upcomingBooking` not null?
- Does it render the card?

## Common Mistakes

### ❌ Wrong time format
```sql
-- Bad (12-hour format without proper parsing)
time: "2:30 PM"

-- Good (24-hour format)
time: "14:30"
```

### ❌ Wrong date format
```sql
-- Bad
date: "01/15/2026"
date: "15-01-2026"

-- Good (YYYY-MM-DD)
date: "2026-01-15"
```

### ❌ Wrong status
```sql
-- These won't show:
status: "pending"
status: "completed"
status: "cancelled"

-- This will show:
status: "upcoming"
```

## Still Not Working?

1. **Check the full error in console:**
   ```javascript
   [Home] Error loading upcoming booking: <error details>
   ```

2. **Test the API directly in browser console:**
   ```javascript
   // Get Supabase instance
   const { supabase } = await import('../lib/supabase');

   // Get current user
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User ID:', user.id);

   // Fetch bookings
   const { data, error } = await supabase
     .from('bookings')
     .select('*')
     .eq('user_id', user.id);
   console.log('Bookings:', data, error);
   ```

3. **Check RLS policies are active:**
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'bookings';
   ```

## Files Modified

✅ [pages/Home.tsx:69-147](pages/Home.tsx#L69-L147) - Added debug logging
✅ `FIX_BOOKINGS_RLS_POLICIES.sql` - Fixed RLS policies
✅ `FIX_UPCOMING_CONSULTATION_USER_DASHBOARD.md` - Detailed fix guide

## Summary

**What was done:**
1. ✅ Added comprehensive console logging to Home.tsx
2. ✅ Added better error handling for date/time parsing
3. ✅ Created SQL script to fix RLS policies
4. ✅ Created debug guide with common issues

**Next steps:**
1. Run `FIX_BOOKINGS_RLS_POLICIES.sql` in Supabase
2. Reload your app and check console logs
3. Create a test booking if needed
4. Verify upcoming consultation appears

**Expected result:**
Upcoming consultation card should appear between the welcome message and "Quick Services" section.
