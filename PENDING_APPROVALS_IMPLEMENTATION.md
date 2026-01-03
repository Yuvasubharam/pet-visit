# Pending Approvals Implementation

## Overview
Implemented a pending approval workflow for doctor consultations. When users select a specific doctor during booking, the consultation is assigned to that doctor with 'pending' status, requiring the doctor to accept or reject the booking.

## Changes Made

### 1. Database Schema Update

**File: `types.ts`**
- **Line 111**: Updated Booking status type to include 'pending'
  ```typescript
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled';
  ```

### 2. Booking Creation Logic

**File: `services/api.ts`**
- **Lines 373, 388, 392**: Added `doctorId` parameter and conditional status
  ```typescript
  async createConsultationBooking(bookingData: {
    // ... other fields
    doctorId?: string;
    // ... other fields
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        // ... other fields
        doctor_id: bookingData.doctorId || null,
        status: bookingData.doctorId ? 'pending' : 'upcoming',
        // ... other fields
      })
  }
  ```

**File: `App.tsx`**
- **Line 485**: Pass doctorId when creating consultation bookings
  ```typescript
  booking = await consultationService.createConsultationBooking({
    // ... other fields
    doctorId: pendingBookingData.doctorId,
    // ... other fields
  });
  ```

### 3. Doctor Dashboard Updates

**File: `pages/DoctorDashboard.tsx`**

**Added State (Line 33):**
```typescript
const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
```

**Added Filter Logic (Lines 82-91):**
```typescript
// Filter pending bookings (assigned to this doctor but awaiting approval)
const pending = allBookings.filter((b: Booking) =>
  b.doctor_id === doctorId &&
  b.status === 'pending'
).sort((a: Booking, b: Booking) => {
  const dateA = new Date(a.created_at || 0);
  const dateB = new Date(b.created_at || 0);
  return dateB.getTime() - dateA.getTime(); // Newest first
});
setPendingBookings(pending);
```

**Added UI Section (Lines 282-402):**
- New "Pending Approvals" section appears between "Upcoming Consultations" and "New Booking Requests"
- Shows bookings assigned to the doctor with 'pending' status
- Includes Accept/Reject buttons
- Displays booking details: pet info, booking type, date/time, address (for home visits)
- Shows count badge with number of pending approvals

### 4. Previous Fixes (Already Applied)

**File: `services/doctorApi.ts`**
- **Line 497**: Filter excludes cancelled bookings
  ```typescript
  const filteredData = data?.filter((booking: any) =>
    (booking.doctor_id === doctorId || booking.doctor_id === null) &&
    booking.status !== 'cancelled'
  ) || [];
  ```

## Workflow

### User Flow:
1. User selects a specific doctor during booking
2. Booking is created with:
   - `doctor_id` = selected doctor's ID
   - `status` = 'pending'
3. User proceeds to payment and completes booking

### Doctor Flow:
1. Doctor logs into dashboard
2. Sees three sections:
   - **Upcoming Consultations**: Accepted bookings (`status = 'upcoming'`)
   - **Pending Approvals**: Bookings assigned to them awaiting approval (`doctor_id = doctorId && status = 'pending'`)
   - **New Booking Requests**: Unassigned bookings (`doctor_id = null`)
3. Doctor can Accept or Reject pending bookings
4. On Accept:
   - `status` changes from 'pending' to 'upcoming'
   - Booking moves to "Upcoming Consultations"
5. On Reject:
   - `status` changes to 'cancelled'
   - Booking is removed from all lists

## Benefits

1. **User Experience**: Users can select their preferred doctor directly
2. **Doctor Control**: Doctors maintain control over their schedule
3. **Clear Separation**: Three distinct categories for better organization
   - Confirmed consultations (upcoming)
   - Pending approvals (assigned but needs confirmation)
   - Open requests (unassigned)
4. **Professional Workflow**: Matches typical appointment booking systems

## Testing Checklist

- [ ] Create a consultation booking by selecting a specific doctor
- [ ] Verify booking appears in doctor's "Pending Approvals" section
- [ ] Accept the booking and verify it moves to "Upcoming Consultations"
- [ ] Create another booking and reject it
- [ ] Verify rejected booking disappears from all sections
- [ ] Create a booking without selecting a doctor
- [ ] Verify it appears in "New Booking Requests" section
- [ ] Accept an unassigned booking
- [ ] Verify it moves to "Upcoming Consultations"

## Database Considerations

**Status Values:**
- `pending`: Booking assigned to doctor, awaiting approval
- `upcoming`: Booking confirmed and scheduled
- `completed`: Consultation finished
- `cancelled`: Booking rejected or cancelled

**Important Notes:**
- Bookings with `doctor_id` set and `status = 'pending'` are visible only to that specific doctor
- Bookings with `doctor_id = null` are visible to all doctors as "New Booking Requests"
- Cancelled bookings are excluded from all doctor views
