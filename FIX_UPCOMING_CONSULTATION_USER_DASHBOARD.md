# Fix: Upcoming Consultation Not Showing in User Dashboard

## Issue
The upcoming consultation section is not fetching/displaying in the user dashboard (Home.tsx) above the "Quick Services" section.

## Root Cause Analysis

The issue is in the Home.tsx file (lines 69-120). The code is:
1. ✅ Fetching consultation and grooming bookings
2. ✅ Filtering for `status === 'upcoming'`
3. ⚠️ But may have issues with:
   - Date/time parsing
   - RLS policies blocking data access
   - Missing joins for pet data

## Solution

### Step 1: Add Debug Logging

First, let's add console logging to see what's happening:

```typescript
// In Home.tsx, line 77-110, update the loadUpcomingBooking function:

const loadUpcomingBooking = async () => {
    if (!userId) {
        console.log('[Home] No userId provided');
        setIsLoadingBooking(false);
        return;
    }

    try {
        setIsLoadingBooking(true);
        console.log('[Home] Fetching bookings for userId:', userId);

        // Fetch both consultation and grooming bookings
        const [consultations, groomings] = await Promise.all([
            consultationService.getUserConsultationBookings(userId),
            groomingService.getUserGroomingBookings(userId)
        ]);

        console.log('[Home] Consultations fetched:', consultations?.length, consultations);
        console.log('[Home] Groomings fetched:', groomings?.length, groomings);

        // Combine all bookings
        const allBookings: Booking[] = [...(consultations || []), ...(groomings || [])];
        console.log('[Home] All bookings combined:', allBookings.length, allBookings);

        // Filter for upcoming bookings
        const now = new Date();
        console.log('[Home] Current time:', now.toISOString());

        const upcomingBookings = allBookings.filter(booking => {
            console.log('[Home] Checking booking:', {
                id: booking.id,
                status: booking.status,
                date: booking.date,
                time: booking.time,
                service_type: booking.service_type
            });

            if (booking.status !== 'upcoming') {
                console.log('[Home] Filtered out - status not upcoming:', booking.status);
                return false;
            }

            const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
            console.log('[Home] Booking date/time:', bookingDateTime.toISOString(), 'vs now:', now.toISOString());

            const isInFuture = bookingDateTime > now;
            console.log('[Home] Is in future?', isInFuture);

            return isInFuture;
        });

        console.log('[Home] Upcoming bookings after filter:', upcomingBookings.length, upcomingBookings);

        // Sort by date and time (earliest first)
        upcomingBookings.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA.getTime() - dateTimeB.getTime();
        });

        // Get the nearest upcoming booking
        if (upcomingBookings.length > 0) {
            console.log('[Home] Setting upcoming booking:', upcomingBookings[0]);
            setUpcomingBooking(upcomingBookings[0]);
        } else {
            console.log('[Home] No upcoming bookings found');
            setUpcomingBooking(null);
        }
    } catch (error) {
        console.error('[Home] Error loading upcoming booking:', error);
        setUpcomingBooking(null);
    } finally {
        setIsLoadingBooking(false);
    }
};
```

### Step 2: Check Supabase RLS Policies

Ensure that the RLS policies allow users to read their own bookings:

```sql
-- Check existing policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'bookings';

-- If the policy doesn't exist, create it:
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Step 3: Verify Booking Data

Check if you have any upcoming bookings in the database:

```sql
-- Check bookings for a specific user
SELECT
  id,
  service_type,
  booking_type,
  status,
  date,
  time,
  created_at
FROM bookings
WHERE user_id = 'YOUR_USER_ID'
ORDER BY date DESC, time DESC;

-- Check if any bookings have status = 'upcoming'
SELECT COUNT(*) as upcoming_count
FROM bookings
WHERE user_id = 'YOUR_USER_ID'
AND status = 'upcoming';
```

### Step 4: Alternative Fix - Simplify Filter Logic

If the date/time parsing is causing issues, update the filter to be more lenient:

```typescript
// Simplified version - show all bookings with status 'upcoming' regardless of date
const upcomingBookings = allBookings.filter(booking => {
    return booking.status === 'upcoming';
});

// Sort by date and time (earliest first)
upcomingBookings.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
});
```

## Testing Checklist

1. [ ] Open browser console (F12)
2. [ ] Navigate to Home page
3. [ ] Check console logs for:
   - userId being passed
   - Number of consultations fetched
   - Number of groomings fetched
   - Filter results
4. [ ] If no bookings are fetched, check RLS policies
5. [ ] If bookings are fetched but filtered out, check date/time format
6. [ ] Create a test booking with status='upcoming' and a future date

## Quick Test Booking

Create a test consultation booking:

```sql
-- Insert a test booking (replace with your actual IDs)
INSERT INTO bookings (
  user_id,
  pet_id,
  service_type,
  booking_type,
  date,
  time,
  status,
  payment_status
) VALUES (
  'YOUR_USER_ID',
  'YOUR_PET_ID',
  'consultation',
  'online',
  '2026-01-15', -- Future date
  '14:30',      -- Future time
  'upcoming',
  'paid'
);
```

## Common Issues & Solutions

### Issue 1: No bookings fetched at all
**Solution**: Check RLS policies - users might not have permission to view their bookings

### Issue 2: Bookings fetched but all filtered out
**Solution**: Check if status is set to 'upcoming' in database, or if date/time is in the past

### Issue 3: Date/time parsing errors
**Solution**: Ensure date is in 'YYYY-MM-DD' format and time is in 'HH:MM' format

### Issue 4: pets data is null
**Solution**: Ensure the pet_id in bookings table references an existing pet

## Expected Behavior

When working correctly, you should see:
1. Loading spinner while fetching
2. An "Upcoming Visit" card showing:
   - Service icon (grooming or medical)
   - Service type and pet name
   - Date and time
   - Click to view booking details

## Files to Check

1. [pages/Home.tsx](pages/Home.tsx#L69-L120) - Main logic
2. [services/api.ts](services/api.ts#L409-L435) - getUserConsultationBookings
3. [services/api.ts](services/api.ts#L507-L525) - getUserGroomingBookings
