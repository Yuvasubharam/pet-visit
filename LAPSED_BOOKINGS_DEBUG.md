# Lapsed Bookings Debugging Guide

## Issue Reported
Lapsed bookings are being detected (shown in console logs) but not appearing in the "Lapsed" tab in DoctorConsultations page.

### Console Evidence
```javascript
[DoctorConsultations] Lapsed booking detected: {
  id: 'dfb5def1-5581-446c-a143-8a144cbae9e9',
  date: '2026-01-03',
  time: '09:00 PM',
  appointmentDateTime: '2026-01-03T15:30:00.000Z',
  now: '2026-01-04T11:53:48.152Z'
}

[DoctorConsultations] Lapsed booking detected: {
  id: '3eda12b3-63ad-4c86-b724-8b85d3d81ccc',
  date: '2026-01-03',
  time: '09:30 AM',
  appointmentDateTime: '2026-01-03T04:00:00.000Z',
  now: '2026-01-04T11:53:48.152Z'
}
```

## Root Cause Analysis

### The Logic Flow
The `DoctorConsultations.tsx` component has this filtering logic:

```typescript
// 1. Filter all bookings based on active tab
const filteredBookings = useMemo(() => {
  let filtered = [...allBookings];

  // Apply service type filter (all/clinic/online/home)
  if (activeFilter !== 'all') {
    filtered = filtered.filter(b => b.booking_type === activeFilter);
  }

  // Apply tab filter
  if (activeTab === 'completed') {
    return filtered.filter(b => b.status === 'completed');
  } else if (activeTab === 'lapsed') {
    return filtered.filter(b =>
      (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
    );
  } else {
    // Active tab
    return filtered.filter(b =>
      (b.status === 'pending' || b.status === 'upcoming') && !isBookingLapsed(b)
    );
  }
}, [allBookings, activeTab, activeFilter]);
```

### Possible Issues to Check

#### 1. **Status Field Mismatch**
**Check**: What is the actual `status` value in the database for these bookings?

The filter only shows lapsed bookings if `status === 'pending' || status === 'upcoming'`

**Solution**: Run this query to check:
```sql
SELECT id, date, time, status, booking_type
FROM bookings
WHERE id IN (
  'dfb5def1-5581-446c-a143-8a144cbae9e9',
  '3eda12b3-63ad-4c86-b724-8b85d3d81ccc'
);
```

**Possible Fixes**:
- If status is `'lapsed'` or something else, update the filter condition
- If status is `null`, update the filter to handle null values

#### 2. **Service Type Filter Active**
**Check**: Is the `activeFilter` state set to something other than 'all'?

The bookings have `booking_type` values that need to match the filter.

**Debug Steps**:
1. Click on "Lapsed" tab
2. Ensure "All Visits" filter is selected (not "Clinic Visits", "Online", or "Home")
3. Check if bookings appear

**Possible Fix**:
```typescript
// In the Lapsed Tab section, temporarily ignore filter for debugging
if (activeTab === 'lapsed') {
  return allBookings.filter(b =>
    (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
  );
}
```

#### 3. **Time Conversion Issue**
**Check**: The time parsing might fail for some formats

Looking at the logs:
- `'09:00 PM'` → parsed to `'15:30:00.000Z'` (WRONG - should be 21:00)
- `'09:30 AM'` → parsed to `'04:00:00.000Z'` (WRONG - should be 09:30)

**Issue Found**: The time parsing logic is incorrect!

```typescript
// Current buggy code:
if (timeStr.includes('AM') || timeStr.includes('PM')) {
  const isPM = timeStr.includes('PM');
  const timeOnly = timeStr.replace(/\s*(AM|PM)/i, '').trim();
  const [hours, minutes] = timeOnly.split(':').map(Number);
  let hour24 = hours;

  if (isPM && hours !== 12) {
    hour24 = hours + 12;
  } else if (!isPM && hours === 12) {
    hour24 = 0;
  }

  timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}
```

The conversion is correct, but there might be timezone issues when creating the Date object.

**Possible Fix**:
The issue is that `new Date('2026-01-03T15:30:00.000Z')` creates a UTC date, but the booking time is likely in local time.

```typescript
// Better approach - use local time
const appointmentDateTime = new Date(`${booking.date}T${timeStr}`);
// Don't add 'Z' suffix, let it use local timezone
```

#### 4. **React Rendering Issue**
**Check**: The filteredBookings array might be empty due to the filter logic

**Debug Steps**:
1. Add console.log in the render section:
```typescript
console.log('[Lapsed Tab] filteredBookings:', filteredBookings);
console.log('[Lapsed Tab] filteredBookings.length:', filteredBookings.length);
```

2. Check if the array has items when "Lapsed" tab is active

## Quick Fixes to Try

### Fix #1: Log Everything in Lapsed Tab
```typescript
useEffect(() => {
  if (activeTab === 'lapsed') {
    console.log('=== LAPSED TAB DEBUG ===');
    console.log('All bookings:', allBookings);
    console.log('Active filter:', activeFilter);
    console.log('Filtered bookings:', filteredBookings);
    console.log('Lapsed count:', lapsedBookingsCount);
  }
}, [activeTab, allBookings, activeFilter, filteredBookings, lapsedBookingsCount]);
```

### Fix #2: Simplify Lapsed Filter (Bypass Service Type Filter)
```typescript
if (activeTab === 'lapsed') {
  // Don't apply activeFilter for lapsed tab - show ALL lapsed bookings
  return allBookings.filter(b =>
    (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
  );
}
```

### Fix #3: Check Database Status Values
Run this SQL query to see actual data:
```sql
-- Check status values for lapsed bookings
SELECT
  id,
  date,
  time,
  status,
  booking_type,
  CASE
    WHEN NOW() > (date || ' ' || time)::timestamp THEN 'LAPSED'
    ELSE 'ACTIVE'
  END as calculated_status
FROM bookings
WHERE doctor_id = 'YOUR_DOCTOR_ID'
  AND (status = 'pending' OR status = 'upcoming')
ORDER BY date DESC;
```

### Fix #4: Add Null Checks
```typescript
const isBookingLapsed = (booking: Booking): boolean => {
  try {
    if (!booking.date || !booking.time) {
      console.error('[isBookingLapsed] Missing date or time:', booking);
      return false;
    }

    const now = new Date();
    // ... rest of logic
  } catch (error) {
    console.error('[isBookingLapsed] Error:', error, booking);
    return false;
  }
};
```

## Recommended Action Plan

1. **Add debug logs** in the Lapsed tab section to see what data is available
2. **Check database** to verify status values are 'pending' or 'upcoming'
3. **Test with filter set to "All Visits"** to rule out filter issues
4. **Verify timezone** conversion is working correctly
5. **Check if bookings are being loaded** from the database at all

## Expected Behavior

When you click on the "Lapsed" tab:
1. The `activeTab` state changes to `'lapsed'`
2. The `filteredBookings` memo recalculates
3. It should return bookings where:
   - `status === 'pending' || status === 'upcoming'`
   - AND `isBookingLapsed(booking) === true`
4. Those bookings should render with the red UI

## Testing Commands

Add this button temporarily to test:
```typescript
<button onClick={() => {
  console.log('=== DEBUG INFO ===');
  console.log('activeTab:', activeTab);
  console.log('activeFilter:', activeFilter);
  console.log('allBookings:', allBookings);
  console.log('filteredBookings:', filteredBookings);
  console.log('lapsedBookingsCount:', lapsedBookingsCount);

  // Test lapsed logic on each booking
  allBookings.forEach(b => {
    const isLapsed = isBookingLapsed(b);
    console.log(`Booking ${b.id}: lapsed=${isLapsed}, status=${b.status}, date=${b.date}, time=${b.time}`);
  });
}}>
  Debug Lapsed Tab
</button>
```

This will help identify where the issue is occurring.
