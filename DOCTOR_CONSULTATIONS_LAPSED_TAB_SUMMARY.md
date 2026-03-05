# Doctor Consultations - Lapsed Tab Implementation Summary

## Changes Made

### 1. Added Lapsed Tab
- Updated state to include `'lapsed'` as a tab option: `useState<'active' | 'lapsed' | 'completed'>('active')`
- Added "Lapsed" tab button in the UI between Active and Completed tabs

### 2. Lapsed Booking Detection
- Added `isBookingLapsed()` function that:
  - Converts 12-hour time format (AM/PM) to 24-hour format
  - Compares appointment datetime with current time
  - Returns true if booking status is 'pending'/'upcoming' AND time has passed

### 3. Tab Filtering Logic
- **Active Tab**: Shows only `pending`/`upcoming` bookings that are NOT lapsed
- **Lapsed Tab**: Shows only `pending`/`upcoming` bookings that ARE lapsed
- **Completed Tab**: Shows only `completed` bookings

### 4. Notification Handler
Added `handleNotifyCustomerReschedule()` function that:
- Takes booking ID and customer name
- Sends notification to customer's notification bell
- Placeholder for actual notification API call (marked with TODO)

## UI Features for Lapsed Bookings

When viewing the Lapsed tab, doctors will see:
- Red-themed card design with border
- "LAPSED" badge
- Pet information
- Owner details
- **"Notify Customer to Reschedule" button** instead of "Mark as Completed"

## How It Works

### For Doctors:
1. Click "Lapsed" tab to see missed appointments
2. Review booking details
3. Click "Notify Customer to Reschedule"
4. System sends notification to customer's app (notification bell)
5. Customer receives message asking them to reschedule

### For Customers:
1. Receive notification in app's notification bell
2. Notification says: "Your appointment time has lapsed. Please reschedule your consultation."
3. Customer can then book a new time slot

## Next Steps (TODO)

### 1. Implement Notification API
Create a notifications table in Supabase:

```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'reschedule_request', 'booking_confirmed', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
```

### 2. Create Notification Service
Add to `services/api.ts` or create `services/notificationApi.ts`:

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

  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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

### 3. Update handleNotifyCustomerReschedule
Replace the TODO in DoctorConsultations.tsx:

```typescript
const handleNotifyCustomerReschedule = async (bookingId: string, userId: string, customerName: string) => {
  if (!confirm(`Send reschedule notification to ${customerName}?`)) return;

  try {
    await notificationService.createNotification({
      user_id: userId,
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

### 4. Add Notification Bell UI Component
Create a notifications dropdown in the user's header to show unread notifications.

## Testing Checklist

- [ ] Lapsed tab appears in doctor consultations
- [ ] Lapsed tab shows only bookings where time has passed
- [ ] Active tab excludes lapsed bookings
- [ ] Notification button appears on lapsed bookings
- [ ] Clicking notification button triggers confirmation dialog
- [ ] Notification is created in database
- [ ] Customer receives notification in their app
- [ ] Notification bell shows unread count
- [ ] Customer can mark notifications as read

## Benefits

1. **Better Appointment Management**: Doctors can see missed appointments separately
2. **Proactive Communication**: Doctors can notify customers to reschedule
3. **Improved Customer Experience**: Customers get clear notification to rebook
4. **Audit Trail**: All reschedule requests are tracked in notifications table
5. **Reduced No-Shows**: Clear communication about lapsed appointments
