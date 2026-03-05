# Weekday Control Feature for Grooming Time Slots

## Overview
The time slot management system now includes weekday control, allowing grooming stores to specify which days of the week each time slot is available.

## Features Added

### 1. **Database Schema Enhancement**
- Added `weekdays` column to `grooming_time_slots` table
- Type: `INTEGER[]` (array of weekday numbers)
- Default: `[0,1,2,3,4,5,6]` (all days)
- Format: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday

### 2. **API Enhancements**

#### `createTimeSlot(storeId, timeSlot, isActive, weekdays)`
- New parameter: `weekdays` (array of day numbers)
- Defaults to all days if not specified

#### `updateTimeSlot(slotId, updates)`
- Can now update `weekdays` array

#### `getAvailableTimeSlots(storeId, date)`
- Filters time slots based on the selected date's day of week
- Only returns slots that are configured for that specific day
- Still filters out already-booked slots

### 3. **UI Features**

#### Time Slot Display
- Shows weekday availability for each time slot
- "All Days" badge when slot is available every day
- Individual day badges (Sun, Mon, Tue, etc.) showing enabled/disabled days
- Visual indicators with color coding

#### Add/Edit Time Slot Modal
- **Weekday Selection Grid**: 7-button layout (one per day)
- **Select/Deselect All**: Quick toggle for all weekdays
- **Visual Feedback**: Selected days highlighted in primary color
- **Dynamic Counter**: Shows how many days are selected
- **Edit Support**: Can edit existing time slots and change their weekdays

### 4. **Smart Filtering**

The system automatically:
1. Checks the day of week for the selected booking date
2. Filters time slots to only show those configured for that day
3. Excludes already-booked slots for that specific date
4. Falls back to default slots if store hasn't configured any

## Usage Flow

### For Grooming Store Owners:
1. Navigate to **Grooming Store Dashboard** → **Time Slots** tab
2. Click **Add New Time Slot**
3. Enter time (e.g., "09:00 AM")
4. Select which days the slot should be available
5. Click **Add Time Slot** or **Update Time Slot**

### For Customers Booking:
1. Select a date in the grooming booking page
2. System automatically shows only time slots available for that day of week
3. Already-booked slots are filtered out
4. Customer sees only truly available time slots

## Examples

### Example 1: Weekend-Only Slot
- Time: "10:00 AM"
- Weekdays: [0, 6] (Sunday and Saturday only)
- Result: Customers only see this slot when booking weekend dates

### Example 2: Weekday-Only Slot
- Time: "02:00 PM"
- Weekdays: [1, 2, 3, 4, 5] (Monday-Friday)
- Result: Customers only see this slot when booking weekday dates

### Example 3: All-Day Slot
- Time: "11:00 AM"
- Weekdays: [0, 1, 2, 3, 4, 5, 6] (All days)
- Result: Customers see this slot every day (default behavior)

## Database Setup

Run the SQL migration file `CREATE_GROOMING_TIME_SLOTS_TABLE.sql` in your Supabase project to create the table with weekday support.

## Benefits

1. **Flexible Scheduling**: Different time slots for different days
2. **Business Hours Control**: Match store's actual operating hours per day
3. **Staff Management**: Align slots with staff availability
4. **Customer Experience**: Show only truly available times
5. **Operational Efficiency**: Reduce manual booking management

## Technical Details

### Type Safety
All weekday arrays are typed as `number[]` in TypeScript interfaces.

### Default Behavior
- If no weekdays specified: defaults to all 7 days
- If empty array: time slot won't appear for any day (effectively disabled)

### Validation
- UI prevents saving time slots with zero weekdays selected
- Alert shown if user tries to save without selecting days
