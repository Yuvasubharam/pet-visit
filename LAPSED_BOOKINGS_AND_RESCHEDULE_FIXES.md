# Lapsed Bookings Display & Reschedule Functionality - Implementation Summary

## Date: 2026-01-04

---

## Issues Fixed

### 1. Lapsed Bookings Not Showing in DoctorConsultations Lapsed Tab ✅

#### Problem
- The "Lapsed" tab in `DoctorConsultations.tsx` was not displaying any bookings
- Lapsed bookings were being filtered correctly but the rendering logic was incorrect
- The UI only showed lapsed bookings when on the "Active" tab, not the "Lapsed" tab

#### Root Cause
The rendering logic at lines 360-456 had a structural flaw:
1. When `activeTab === 'lapsed'`, the bookings array already contained only lapsed bookings (filtered at lines 119-124)
2. But the render code tried to separate them again into `lapsedBookings` and `activeBookings`
3. The "Missed Appointments" section only rendered when `activeTab === 'active'` (line 368), so it never showed on the lapsed tab

#### Solution
Restructured the rendering logic to handle three tab states properly:

```typescript
{/* Render bookings based on active tab */}
{activeTab === 'lapsed' ? (
  <>
    {/* Lapsed Tab - Show all lapsed bookings */}
    <div className="flex items-center gap-2 pt-2 mb-4">
      <span className="material-symbols-outlined text-red-500 text-xl">schedule</span>
      <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Missed Appointments</h3>
    </div>
    {bookings.map((booking) => {
      // Render lapsed booking cards with red styling
      ...
    })}
  </>
) : (
  <>
    {/* Active/Completed Tabs - Separate lapsed from active */}
    {(() => {
      const lapsedBookings = bookings.filter((b: Booking) => isBookingLapsed(b));
      const activeBookings = bookings.filter((b: Booking) => !isBookingLapsed(b));

      return (
        <>
          {/* Show lapsed section only on active tab */}
          {lapsedBookings.length > 0 && activeTab === 'active' && (
            ...
          )}
          {/* Show active/completed bookings */}
          {activeBookings.map(...)}
        </>
      );
    })()}
  </>
)}
```

**Changes in `pages/DoctorConsultations.tsx` (Lines 360-540):**
- Added conditional rendering based on `activeTab === 'lapsed'`
- When on lapsed tab: directly render all bookings (already filtered as lapsed)
- When on active/completed tabs: separate bookings and show both lapsed (if any) and active sections
- Fixed indentation and JSX fragment structure

---

### 2. Reschedule Functionality Not Navigating to Booking Page ✅

#### Problem
- Clicking "Reschedule" button in `BookingDetails.tsx` and `BookingsOverview.tsx` did nothing
- Should navigate to the appropriate booking page (online-consult, home-consult, or grooming) based on the booking type
- The booking type context was lost during navigation

#### Solution
Implemented proper reschedule navigation flow:

**1. Updated `BookingDetails.tsx`:**
- Added `onReschedule?: (booking: Booking) => void` prop (line 62)
- Updated component to accept the prop (line 73)
- Connected reschedule button to call `onReschedule(booking)` (line 1132)

```typescript
<button
  onClick={() => onReschedule && booking && onReschedule(booking)}
  className="w-full py-5 bg-primary text-white font-black text-base rounded-[28px]..."
>
  <span className="material-symbols-outlined font-black">edit_calendar</span>
  Reschedule
</button>
```

**2. Updated `BookingsOverview.tsx`:**
- Added `onReschedule?: (booking: Booking) => void` prop (line 14)
- Updated component to accept the prop (line 18)
- Updated lapsed booking reschedule button to use callback (lines 460-467)

```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    if (onReschedule) {
      onReschedule(booking);
    } else {
      onPlusClick(); // Fallback
    }
  }}
  className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500..."
>
  <span className="material-symbols-outlined text-lg font-black">event_repeat</span>
  Reschedule Appointment
</button>
```

**3. Updated `App.tsx` - Wired Navigation Logic:**

For `bookings-overview` route (lines 626-637):
```typescript
onReschedule={(booking) => {
  // Navigate to appropriate booking page based on booking type
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

For `booking-details` route (lines 647-658):
```typescript
onReschedule={(booking) => {
  // Navigate to appropriate booking page based on booking type
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

---

## Booking Type Navigation Matrix

| Service Type | Booking Type | Navigation Target |
|-------------|-------------|------------------|
| consultation | online | `online-consult-booking` |
| consultation | home | `home-consult-booking` |
| consultation | clinic | `home-consult-booking` |
| grooming | home | `grooming` |
| grooming | clinic | `grooming` |

---

## Files Modified

### 1. `pages/DoctorConsultations.tsx`
**Lines modified: 360-540**
- Fixed lapsed tab rendering logic
- Added conditional rendering for lapsed vs active/completed tabs
- Proper JSX structure with correct fragment nesting
- Type annotations for filter callbacks

### 2. `pages/BookingDetails.tsx`
**Lines modified: 57-63, 73, 1131-1137**
- Added `onReschedule` prop to Props interface
- Updated component function signature
- Connected reschedule button onClick handler

### 3. `pages/BookingsOverview.tsx`
**Lines modified: 6-16, 18, 459-472**
- Added `onReschedule` prop to Props interface
- Updated component function signature
- Connected reschedule button with fallback logic

### 4. `App.tsx`
**Lines modified: 611-660**
- Added `onReschedule` handler to BookingsOverview route
- Added `onReschedule` handler to BookingDetails route
- Implemented navigation logic based on booking type

---

## How Lapsed Booking Detection Works

The `isBookingLapsed()` function (lines 24-74 in DoctorConsultations.tsx) determines if a booking has lapsed:

```typescript
const isBookingLapsed = (booking: Booking): boolean => {
  const now = new Date();

  // Convert 12-hour time (AM/PM) to 24-hour format
  let timeStr = booking.time;
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    // Parse and convert...
  }

  const appointmentDateTime = new Date(`${booking.date}T${timeStr}`);

  // Booking is lapsed if:
  // 1. Status is still 'upcoming' or 'pending'
  // 2. The scheduled time has passed
  return (booking.status === 'upcoming' || booking.status === 'pending') &&
         appointmentDateTime < now;
};
```

**Lapsed Criteria:**
1. Status must be `'upcoming'` or `'pending'` (not completed/cancelled)
2. Current time > scheduled appointment time

---

## Testing Checklist

### Lapsed Bookings Display
- [ ] Navigate to Doctor Consultations page
- [ ] Click on "Lapsed" tab
- [ ] Verify lapsed bookings appear with red styling
- [ ] Verify "Missed Appointments" header is visible
- [ ] Verify "Notify Customer to Reschedule" button appears
- [ ] Switch to "Active" tab
- [ ] Verify lapsed bookings appear in "Missed Appointments" section
- [ ] Verify upcoming appointments appear in "Upcoming Appointments" section

### Reschedule Navigation
- [ ] From BookingsOverview - Click reschedule on lapsed online consultation
  - Should navigate to `online-consult-booking`
- [ ] From BookingsOverview - Click reschedule on lapsed home consultation
  - Should navigate to `home-consult-booking`
- [ ] From BookingsOverview - Click reschedule on lapsed grooming booking
  - Should navigate to `grooming`
- [ ] From BookingDetails - Click reschedule on any consultation
  - Should navigate to appropriate consultation booking page
- [ ] From BookingDetails - Click reschedule on grooming booking
  - Should navigate to `grooming`

### Edge Cases
- [ ] Verify reschedule works for clinic consultations (navigates to home-consult-booking)
- [ ] Verify fallback to `onPlusClick` if `onReschedule` is not provided
- [ ] Verify no errors when booking data is incomplete
- [ ] Verify time parsing works for both 12-hour (AM/PM) and 24-hour formats

---

## UI/UX Improvements

### Lapsed Booking Card Styling
- **Background**: Red tinted (`bg-red-50`)
- **Border**: 2px red border (`border-2 border-red-200`)
- **Badge**: "LAPSED" in red
- **Left accent**: Red vertical bar
- **Button**: Gradient orange-to-red "Notify Customer to Reschedule"

### Active Tab Lapsed Section
- **Section Header**: "Missed Appointments" with clock icon
- **Separator**: "Upcoming Appointments" header when both lapsed and active bookings exist
- **Clear visual distinction** between lapsed and active bookings

---

## Future Enhancements

1. **Pre-fill Booking Data**: When navigating to reschedule, pre-populate:
   - Selected pet
   - Previously selected doctor (if available)
   - Previous booking type preference

2. **Notification System**: Implement actual notification API for "Notify Customer to Reschedule" button
   - Create notification record in database
   - Send push notification or email
   - Track notification status

3. **Booking Cancellation**: Implement cancel booking functionality
   - Update booking status to 'cancelled'
   - Refund logic if applicable
   - Notification to doctor/customer

4. **Reschedule Confirmation**: Add confirmation dialog before navigating
   - Show current booking details
   - Confirm user wants to create new booking

---

## Technical Notes

- All booking type checks use `booking.service_type` and `booking.booking_type`
- Navigation is centralized in App.tsx using `setCurrentView`
- Booking object is passed through callbacks for context preservation
- Type safety maintained with proper TypeScript interfaces
- Fallback logic ensures graceful degradation if callbacks missing

---

## Console Logging

For debugging, the following console logs are active:

```typescript
// Lapsed booking detection
console.log('[DoctorConsultations] Lapsed booking detected:', {
  id: booking.id,
  date: booking.date,
  time: booking.time,
  appointmentDateTime: appointmentDateTime.toISOString(),
  now: now.toISOString()
});
```

These can be removed in production or wrapped in a DEBUG flag.

---

## Summary

✅ **Issue 1 Fixed**: Lapsed bookings now properly display in the Lapsed tab
✅ **Issue 2 Fixed**: Reschedule buttons now navigate to appropriate booking pages based on booking type
✅ **Code Quality**: Proper TypeScript types, clean JSX structure, and consistent patterns
✅ **User Experience**: Clear visual indicators, intuitive navigation, and proper error handling

Both issues have been successfully resolved with minimal code changes and maximum maintainability.
