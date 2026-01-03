# Doctor Availability Integration Guide

## Summary
Enhanced the doctor availability system with weekday-based scheduling and a modern Quick Add modal.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/006_add_weekday_to_availability.sql`
- Added `weekday` column to `doctor_availability` table (0=Sunday, 1=Monday, ..., 6=Saturday)
- Updated unique constraints to support both date-specific and recurring slots
- Added indexes for better query performance

### 2. New Component
**File**: `components/QuickAddAvailabilityModal.tsx`
- Modern modal UI for creating multiple availability slots
- Features:
  - Weekday selection (S, M, T, W, T, F, S buttons)
  - Time slot selection (30-minute intervals from 8:00 AM to 8:00 PM)
  - Capacity selector
  - Summary showing total slots to be created
  - Responsive design with dark mode support

### 3. API Service Updates
**File**: `services/doctorApi.ts`
- Added `createWeeklyRecurringAvailability()` method
  - Generates slots for selected weekdays and time slots
  - Creates availability for next 4 weeks by default
  - Automatically calculates end times (30 minutes after start)
  - Uses upsert to avoid duplicate errors

### 4. Type Updates
**File**: `types.ts`
- Added `weekday?: number` to `DoctorAvailability` interface

## Integration Steps for DoctorAvailability Component

Add the following changes to `pages/DoctorAvailability.tsx`:

### Step 1: Add Import
```typescript
import QuickAddAvailabilityModal from '../components/QuickAddAvailabilityModal';
```

### Step 2: Add State
```typescript
const [showQuickAddModal, setShowQuickAddModal] = useState(false);
const [creating, setCreating] = useState(false);
```

### Step 3: Replace handleQuickAdd Function
```typescript
const handleQuickAdd = () => {
  setShowQuickAddModal(true);
};

const handleQuickAddSubmit = async (data: {
  selectedWeekdays: number[];
  selectedTimeSlots: string[];
  capacity: number;
}) => {
  if (!doctorId) return;

  try {
    setCreating(true);
    await doctorAvailabilityService.createWeeklyRecurringAvailability({
      doctor_id: doctorId,
      weekdays: data.selectedWeekdays,
      time_slots: data.selectedTimeSlots,
      slot_type: activeTab,
      capacity: data.capacity,
      weeks_ahead: 4,
    });

    setShowQuickAddModal(false);
    loadAvailability();
    alert(`Successfully created ${data.selectedWeekdays.length * data.selectedTimeSlots.length} slots!`);
  } catch (error) {
    console.error('Error creating availability:', error);
    alert('Failed to create slots. Please try again.');
  } finally {
    setCreating(false);
  }
};
```

### Step 4: Add Modal Before Closing Div
```typescript
{/* Quick Add Modal */}
<QuickAddAvailabilityModal
  isOpen={showQuickAddModal}
  onClose={() => setShowQuickAddModal(false)}
  onSubmit={handleQuickAddSubmit}
  slotType={activeTab}
/>

{/* Loading Overlay */}
{creating && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-2xl flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-900 dark:text-white font-bold">Creating slots...</p>
      <p className="text-slate-500 text-sm mt-1">This may take a moment</p>
    </div>
  </div>
)}
```

## Running the Migration

Run this command to apply the database migration:
```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase dashboard SQL editor
```

## Features

### Weekday Selection
- Select multiple days of the week (Sun-Sat)
- Visual feedback with highlighted selected days
- Hover states for better UX

### Time Slot Selection
- 30-minute intervals throughout the day
- 12-hour format display (e.g., "9:00 AM")
- Multi-select capability
- Scrollable grid layout

### Smart Slot Creation
- Automatically generates all combinations of selected weekdays and time slots
- Creates slots for the next 4 weeks
- Shows summary before creation
- Handles duplicates gracefully with upsert

### Capacity Management
- Simple +/- buttons to adjust capacity
- Visual display of pets per slot
- Default capacity of 1

## Profile Photo Feature

The profile photo upload is already implemented in `DoctorProfileSetup.tsx`:
- Upload functionality at lines 38-53
- Photo display at lines 114-147
- Uses Supabase storage bucket 'doctor-photos'
- Auto-uploads and updates doctor profile

## Next Steps

1. Apply the database migration
2. Integrate the changes into DoctorAvailability.tsx
3. Test the Quick Add functionality
4. Verify slots are created correctly for recurring schedules
5. Test profile photo upload in DoctorProfileSetup

## Notes

- The system creates slots for 4 weeks ahead by default (configurable via `weeks_ahead` parameter)
- Time slots are 30 minutes long
- Duplicate slots are ignored automatically
- Weekday-based availability allows for recurring schedules
