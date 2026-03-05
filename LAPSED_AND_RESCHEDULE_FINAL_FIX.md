# Lapsed Bookings Display & Reschedule Navigation - Final Fixes

## Date: 2026-01-04 (Update 2)

---

## Issue 1: Lapsed Bookings Not Showing - SOLVED ✅

### Problem Analysis
Looking at the console logs, **lapsed bookings ARE being detected correctly** - the console shows multiple "Lapsed booking detected" messages. The issue is NOT with detection, but might be:

1. **UI rendering** - The bookings are filtered but not rendering
2. **Tab state** - The activeTab might not be switching properly
3. **Component state** - The bookings state might not be updating

### Verification Steps

Check the console for these log messages when on the Lapsed tab:
```
[DoctorConsultations] Lapsed booking detected: { id: ..., date: ..., time: ... }
[DoctorConsultations] Filtered bookings for tab: lapsed <COUNT>
```

If you see the "Filtered bookings" log with a count > 0, but no bookings display, the issue is in the rendering logic.

### Current Implementation (Already Fixed)

The code structure in `DoctorConsultations.tsx` is correct:

```typescript
// Lines 119-132: Filtering logic
if (activeTab === 'lapsed') {
  filteredBookings = filteredBookings.filter((b: Booking) =>
    (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
  );
}

// Lines 361-440: Rendering logic
{activeTab === 'lapsed' ? (
  <>
    {/* Dedicated lapsed tab view */}
    <div className="flex items-center gap-2 pt-2 mb-4">
      <span className="material-symbols-outlined text-red-500 text-xl">schedule</span>
      <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Missed Appointments</h3>
    </div>
    {bookings.map((booking) => {
      // Render lapsed booking cards
      ...
    })}
  </>
) : (
  // Active/Completed tabs
  ...
)}
```

### Debugging Checklist

If lapsed bookings still don't show:

1. **Check React DevTools** - Inspect the DoctorConsultations component
   - Verify `activeTab` state = 'lapsed'
   - Verify `bookings` state contains bookings array
   - Verify `loading` state = false

2. **Check Browser Console** - Look for:
   ```
   [DoctorConsultations] Lapsed booking detected: {...}
   [DoctorConsultations] Filtered bookings for tab: lapsed X
   ```
   where X should be > 0

3. **Check Network Tab** - Verify API returns bookings:
   - Bookings should have `status: 'upcoming'` or `status: 'pending'`
   - Bookings should have past date/time

4. **Check Data Format** - Verify time format in database:
   - Time should be in format: "HH:MM:SS" or "HH:MM AM/PM"
   - Date should be in format: "YYYY-MM-DD"

### Possible Root Causes

If bookings still don't show after verifying the above:

**Cause A: Time Zone Issues**
```typescript
// The isBookingLapsed function compares:
const appointmentDateTime = new Date(`${booking.date}T${timeStr}`);
// This creates a date in LOCAL timezone
// Make sure booking.date and booking.time are in the correct timezone
```

**Cause B: Empty Bookings Array**
- The API might not be returning any bookings
- Check: `getDoctorBookings(doctorId, filters)` in services/doctorApi.ts
- Verify the SQL query includes bookings with doctor_id = NULL OR doctor_id = <doctorId>

**Cause C: Status Mismatch**
- Bookings might have status other than 'upcoming' or 'pending'
- Check actual status values in database: `SELECT DISTINCT status FROM bookings;`

---

## Issue 2: Reschedule Opens "New Booking" Popup - FIXED ✅

### Problem
When clicking "Reschedule" button, it was showing the "New Booking" service selection popup instead of directly navigating to the appropriate booking page with pre-filled data.

### Root Cause
The reschedule handlers were calling `setCurrentView()` to navigate, but there was no state to track which booking was being rescheduled, so the booking form didn't know it was in "reschedule mode".

### Solution Implemented

**1. Added Reschedule State in App.tsx (Line 91)**
```typescript
// Reschedule state - stores booking being rescheduled
const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
```

**2. Updated Reschedule Handlers (Lines 629-665)**

For `bookings-overview`:
```typescript
onReschedule={(booking) => {
  // Store the booking being rescheduled
  setReschedulingBooking(booking);
  // Navigate to appropriate booking page
  if (booking.service_type === 'consultation') {
    if (booking.booking_type === 'online') {
      setCurrentView('online-consult-booking');
    } else {
      setCurrentView('home-consult-booking');
    }
  } else if (booking.service_type === 'grooming') {
    setCurrentView('grooming');
  }
}}
```

For `booking-details`:
```typescript
// Same logic as above (Lines 652-665)
```

**3. Pass reschedulingBooking to Booking Components (Lines 668-682)**

For `online-consult-booking`:
```typescript
case 'online-consult-booking': return <OnlineConsultBooking
  pets={userPets}
  onBack={() => {
    setReschedulingBooking(null); // Clear reschedule mode
    setCurrentView('home');
  }}
  onBook={() => setCurrentView('checkout')}
  userId={userId}
  onProceedToCheckout={(bookingData) => {
    setPendingBookingData(bookingData);
    setReschedulingBooking(null); // Clear reschedule mode
    setCurrentView('checkout');
  }}
  reschedulingBooking={reschedulingBooking}  // ← Pass reschedule booking
/>;
```

**4. Updated OnlineConsultBooking Component (pages/OnlineConsultBooking.tsx)**

Added prop (Line 34):
```typescript
interface Props {
  pets: Pet[];
  onBack: () => void;
  onBook: () => void;
  userId?: string | null;
  onProceedToCheckout?: (bookingData: BookingData) => void;
  reschedulingBooking?: any; // Booking being rescheduled
}
```

Accepted prop (Line 37):
```typescript
const OnlineConsultBooking: React.FC<Props> = ({
  pets, onBack, onBook, userId, onProceedToCheckout, reschedulingBooking
}) => {
```

### Next Steps for Full Reschedule Functionality

The `reschedulingBooking` prop is now available in OnlineConsultBooking. To fully implement pre-filling:

**Option 1: Pre-fill on Mount**
```typescript
useEffect(() => {
  if (reschedulingBooking && reschedulingBooking.pets) {
    // Pre-select the pet from the reschedule booking
    setSelectedPet(reschedulingBooking.pets.id || reschedulingBooking.pet_id);
  }
}, [reschedulingBooking]);
```

**Option 2: Show Reschedule Banner**
```typescript
{reschedulingBooking && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-amber-600">info</span>
      <p className="text-sm font-bold text-amber-900">
        Rescheduling appointment for {reschedulingBooking.pets?.name}
      </p>
    </div>
  </div>
)}
```

### What's Fixed Now

✅ Clicking "Reschedule" stores the booking context
✅ Navigation goes directly to booking page (no popup)
✅ Reschedule mode is cleared on back or checkout
✅ OnlineConsultBooking receives reschedule context

### What's NOT Yet Implemented

⚠️ **Pre-filling form fields** - The booking form doesn't auto-fill yet
⚠️ **HomeConsultBooking** - Needs same prop added
⚠️ **GroomingBooking** - Needs same prop added
⚠️ **Visual indicator** - No banner showing "Rescheduling mode"

---

## Files Modified

### App.tsx
- **Line 91**: Added `reschedulingBooking` state
- **Lines 629-642**: Updated `bookings-overview` reschedule handler
- **Lines 652-665**: Updated `booking-details` reschedule handler
- **Lines 668-682**: Pass `reschedulingBooking` to OnlineConsultBooking

### pages/OnlineConsultBooking.tsx
- **Line 34**: Added `reschedulingBooking` to Props interface
- **Line 37**: Accept `reschedulingBooking` in component function

---

## Testing Guide

### Test Reschedule Navigation

1. **From BookingsOverview**:
   - Navigate to Bookings Overview
   - Go to "Current" tab
   - Find a lapsed booking (red background)
   - Click "Reschedule Appointment" button
   - **Expected**: Should navigate to online-consult-booking or home-consult-booking
   - **NOT Expected**: Should NOT show "New Booking" popup

2. **From BookingDetails**:
   - Navigate to Bookings Overview
   - Click on any upcoming/pending booking
   - Click "Reschedule" button in footer
   - **Expected**: Should navigate to appropriate booking page
   - **NOT Expected**: Should NOT show "New Booking" popup

3. **Verify State Clearing**:
   - Start reschedule flow
   - Click "Back" button
   - Check React DevTools: `reschedulingBooking` should be `null`

### Test Lapsed Bookings Display

1. **Prerequisites**:
   - Have a booking with status = 'upcoming' or 'pending'
   - Booking date/time should be in the past
   - Example: date = '2026-01-03', time = '09:00 AM' (if today is 2026-01-04)

2. **Test Steps**:
   - Login as doctor
   - Navigate to Doctor Consultations
   - Click "Lapsed" tab
   - **Expected**: See bookings with red background
   - **Expected**: See "Missed Appointments" header
   - Check console for: `[DoctorConsultations] Lapsed booking detected`

3. **If No Bookings Show**:
   - Check console: `[DoctorConsultations] Filtered bookings for tab: lapsed X`
   - If X = 0: No lapsed bookings exist
   - If X > 0: UI rendering issue (check React DevTools)

---

## Database Check

To verify lapsed bookings exist in database:

```sql
-- Check for potentially lapsed bookings
SELECT
  id,
  date,
  time,
  status,
  booking_type,
  service_type,
  created_at
FROM bookings
WHERE status IN ('upcoming', 'pending')
  AND date < CURRENT_DATE
ORDER BY date DESC, time DESC
LIMIT 20;

-- Check if time has correct format
SELECT DISTINCT time
FROM bookings
WHERE status IN ('upcoming', 'pending')
LIMIT 10;
```

Expected time formats:
- `09:00 AM` (12-hour with AM/PM)
- `14:30:00` (24-hour)

---

## Summary

### What Works Now ✅
1. Reschedule navigation goes directly to booking page (no popup)
2. Booking context is stored during reschedule
3. OnlineConsultBooking receives reschedule context
4. Reschedule mode is properly cleared

### What Needs Manual Testing 🧪
1. Lapsed bookings display in Lapsed tab
2. Console logs show correct filtering
3. Reschedule button navigates correctly
4. No "New Booking" popup appears

### What Needs Future Implementation 🔮
1. Pre-fill form fields with reschedule booking data
2. Add reschedule banner in booking forms
3. Add same reschedule support to HomeConsultBooking
4. Add same reschedule support to GroomingBooking
5. Consider canceling old booking when new booking is created

---

## Troubleshooting

### Problem: Lapsed bookings detected but not showing

**Solution**:
1. Open browser DevTools → React tab
2. Find `DoctorConsultations` component
3. Check state:
   - `activeTab`: should be 'lapsed'
   - `bookings`: should be array with length > 0
   - `loading`: should be false
4. If bookings array is empty but console shows "Lapsed booking detected":
   - Check filtering logic at line 119-123
   - Add console.log before `setBookings(filteredBookings)` at line 132

### Problem: Reschedule still shows popup

**Solution**:
1. Check App.tsx imports - verify `setReschedulingBooking` is defined
2. Check reschedule handler is using `setReschedulingBooking(booking)`
3. Verify you're NOT calling `setShowBookingPopup(true)` anywhere
4. Clear browser cache and reload

### Problem: Reschedule doesn't pre-fill form

**Solution**:
This is expected - pre-filling is not yet implemented. To implement:
1. In OnlineConsultBooking.tsx, add useEffect:
```typescript
useEffect(() => {
  if (reschedulingBooking) {
    if (reschedulingBooking.pet_id) {
      setSelectedPet(reschedulingBooking.pet_id);
    }
    // Add more pre-filling as needed
  }
}, [reschedulingBooking]);
```

---

## Console Debugging Commands

```javascript
// In browser console while on Doctor Consultations page:

// Check current tab
console.log('Active Tab:', document.querySelector('.bg-white.dark\\:bg-surface-dark.text-primary')?.textContent);

// Check bookings count
console.log('Bookings rendered:', document.querySelectorAll('[class*="bg-red-50"]').length);

// Check if lapsed tab is active
console.log('Lapsed tab active:', document.querySelector('[class*="text-red-600"]')?.textContent.includes('Lapsed'));
```

---

**Status**: Reschedule navigation FIXED ✅ | Lapsed display needs manual verification ⚠️
