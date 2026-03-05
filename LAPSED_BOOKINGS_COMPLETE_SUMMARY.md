# Lapsed Bookings Implementation - Complete Summary

## Overview
Fixed the issue where lapsed bookings (appointments where the scheduled time has passed but status is still 'upcoming' or 'pending') were appearing as normal bookings in both customer and doctor views. Now they are properly detected and displayed with appropriate actions.

---

## Customer View ([BookingsOverview.tsx](pages/BookingsOverview.tsx))

### Changes Made

1. **Time Parsing Fix** ([BookingsOverview.tsx:89-140](pages/BookingsOverview.tsx#L89-L140))
   - Fixed `isBookingLapsed()` function to properly handle 12-hour time format (AM/PM)
   - Converts "09:00 AM" to 24-hour format before parsing
   - Adds error handling and logging for debugging

2. **Lapsed Bookings Display**
   - Lapsed bookings appear in a separate "Missed Appointments" section at the top
   - Red-themed design with distinctive styling
   - Shows "LAPSED" status badge
   - Displays "RESCHEDULE APPOINTMENT" button instead of "JOIN CONSULTATION"

3. **Booking Separation** ([BookingsOverview.tsx:186-188](pages/BookingsOverview.tsx#L186-L188))
   ```typescript
   const lapsedBookings = applyAllFilters(allCurrentBookings.filter(b => isBookingLapsed(b)));
   const activeCurrentBookings = applyAllFilters(allCurrentBookings.filter(b => !isBookingLapsed(b)));
   ```

### Visual Design for Lapsed Bookings
- 🔴 Red background (`bg-red-50`)
- 🔴 Red border (`border-2 border-red-200`)
- 🔴 Red icon and text
- 📍 "Missed Appointments" header with schedule icon
- 🔔 "RESCHEDULE APPOINTMENT" button in gradient red/orange

---

## Doctor View ([DoctorConsultations.tsx](pages/DoctorConsultations.tsx))

### Changes Made

1. **Added Lapsed Tab** ([DoctorConsultations.tsx:13](pages/DoctorConsultations.tsx#L13))
   - Three tabs: Active | Lapsed | Completed
   - Tab state: `useState<'active' | 'lapsed' | 'completed'>('active')`

2. **Time Detection** ([DoctorConsultations.tsx:23-74](pages/DoctorConsultations.tsx#L23-L74))
   - Same `isBookingLapsed()` function as customer view
   - Handles AM/PM time conversion
   - Validates parsed dates

3. **Tab Filtering Logic** ([DoctorConsultations.tsx:115-132](pages/DoctorConsultations.tsx#L115-L132))
   ```typescript
   if (activeTab === 'completed') {
     filteredBookings = filteredBookings.filter((b: Booking) => b.status === 'completed');
   } else if (activeTab === 'lapsed') {
     filteredBookings = filteredBookings.filter((b: Booking) =>
       (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
     );
   } else {
     filteredBookings = filteredBookings.filter((b: Booking) =>
       (b.status === 'pending' || b.status === 'upcoming') && !isBookingLapsed(b)
     );
   }
   ```

4. **Notification Handler** ([DoctorConsultations.tsx:179-203](pages/DoctorConsultations.tsx#L179-L203))
   - `handleNotifyCustomerReschedule()` function
   - Sends notification to customer's notification bell
   - Includes placeholder for actual API call (marked TODO)

5. **Updated Button for Lapsed Bookings** ([DoctorConsultations.tsx:436-443](pages/DoctorConsultations.tsx#L436-L443))
   - Changed from "Mark as Completed" to "Notify Customer to Reschedule"
   - Uses notification bell icon instead of check circle
   - Calls notification handler when clicked

---

## How It Works

### For Customers (BookingsOverview)

**Current Tab:**
1. ✅ Shows "Missed Appointments" section if any lapsed bookings exist
2. 🔴 Lapsed bookings displayed in red with "LAPSED" badge
3. 🔔 "RESCHEDULE APPOINTMENT" button shown
4. ➡️ Clicking button navigates to booking page to create new appointment

**Separation:**
- Lapsed bookings at the top
- Active upcoming bookings below
- Clear visual distinction

### For Doctors (DoctorConsultations)

**Three Tabs:**
1. **Active Tab**: Only shows upcoming appointments that are NOT lapsed
2. **Lapsed Tab**: Only shows appointments where time passed (dedicated view)
3. **Completed Tab**: Shows completed consultations

**Lapsed Tab Actions:**
- 📋 View all missed appointments in one place
- 👁️ See patient and booking details
- 🔔 Click "Notify Customer to Reschedule"
- ✉️ System sends notification to customer's notification bell
- 📱 Customer receives notification in their app

---

## Key Features

### 1. Accurate Time Detection
- ✅ Handles both 12-hour (AM/PM) and 24-hour time formats
- ✅ Properly converts "09:00 AM" → "09:00:00" (24-hour)
- ✅ Properly converts "09:00 PM" → "21:00:00" (24-hour)
- ✅ Handles edge cases (12:00 AM = 00:00, 12:00 PM = 12:00)

### 2. Visual Distinction
- 🔴 Red theme for lapsed bookings
- 🟢 Normal theme for active bookings
- ⚪ Muted theme for completed bookings

### 3. Appropriate Actions
- **Customer - Lapsed**: "Reschedule Appointment" (create new booking)
- **Doctor - Lapsed**: "Notify Customer to Reschedule" (send notification)
- **Customer - Active**: "Join Consultation" or "View Details"
- **Doctor - Active**: "Join Call", "Accept", or "Reject"

---

## Next Steps (Implementation Required)

### 1. Create Notifications Table

Run this SQL in Supabase:

```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

### 2. Implement Notification Service

Add to `services/api.ts`:

```typescript
export const notificationService = {
  async createNotification(data: {
    user_id: string;
    booking_id?: string;
    type: string;
    title: string;
    message: string;
  }) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return notification;
  },

  async getUserNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }
};
```

### 3. Update Notification Handler

Replace the TODO in [DoctorConsultations.tsx:179-203](pages/DoctorConsultations.tsx#L179-L203):

```typescript
const handleNotifyCustomerReschedule = async (bookingId: string, customerName: string) => {
  if (!confirm(`Send reschedule notification to ${customerName}?`)) return;

  try {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    await notificationService.createNotification({
      user_id: booking.user_id,
      booking_id: bookingId,
      type: 'reschedule_request',
      title: 'Appointment Reschedule Required',
      message: 'Your appointment time has lapsed. Please reschedule your consultation at your earliest convenience.'
    });

    alert(`Reschedule notification sent to ${customerName}.`);
    await loadData();
  } catch (error) {
    console.error('[DoctorConsultations] Error sending notification:', error);
    alert('Failed to send notification. Please try again.');
  }
};
```

### 4. Add Notification Bell UI

Create a NotificationBell component in the app header:
- Shows unread count badge
- Dropdown to display recent notifications
- Mark as read functionality
- Click notification to navigate to related booking

---

## Testing Checklist

### Customer View
- [ ] Lapsed bookings appear in "Missed Appointments" section
- [ ] Lapsed bookings have red background and border
- [ ] "RESCHEDULE APPOINTMENT" button is shown
- [ ] Active bookings show "JOIN CONSULTATION" button
- [ ] Sections are clearly separated

### Doctor View
- [ ] Three tabs appear: Active, Lapsed, Completed
- [ ] Active tab shows only non-lapsed upcoming bookings
- [ ] Lapsed tab shows only lapsed bookings
- [ ] "Notify Customer to Reschedule" button appears in Lapsed tab
- [ ] Clicking button shows confirmation dialog
- [ ] Notification is sent to customer
- [ ] Customer receives notification in notification bell

### Time Detection
- [ ] Test with 12-hour format: "09:00 AM", "02:30 PM"
- [ ] Test with edge cases: "12:00 AM", "12:00 PM"
- [ ] Test with past bookings (should be lapsed)
- [ ] Test with future bookings (should be active)
- [ ] Verify logging in console for lapsed bookings

---

## Files Modified

1. **[pages/BookingsOverview.tsx](pages/BookingsOverview.tsx)**
   - Fixed `isBookingLapsed()` time parsing
   - Added lapsed bookings section
   - Updated UI for reschedule button

2. **[pages/DoctorConsultations.tsx](pages/DoctorConsultations.tsx)**
   - Added Lapsed tab
   - Implemented tab filtering logic
   - Added `handleNotifyCustomerReschedule()` function
   - Updated lapsed booking UI

3. **Documentation**
   - `DOCTOR_CONSULTATIONS_LAPSED_TAB_SUMMARY.md`
   - `LAPSED_BOOKINGS_COMPLETE_SUMMARY.md` (this file)

---

## Benefits

✅ **Better User Experience**: Customers see clear indication of missed appointments
✅ **Proactive Communication**: Doctors can notify customers to reschedule
✅ **Organized Dashboard**: Separate tabs for active, lapsed, and completed appointments
✅ **Reduced Confusion**: Clear visual distinction between booking states
✅ **Audit Trail**: Notifications tracked in database
✅ **Improved Scheduling**: Customers can easily rebook from notification
