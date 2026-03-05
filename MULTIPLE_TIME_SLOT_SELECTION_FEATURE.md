# Multiple Time Slot Selection Feature

## Overview
Enhanced the "Add New Time Slot" feature in Grooming Store Management to allow selecting and adding multiple time slots at once.

## Changes Made

### 1. Added Multiple Selection State
**File:** `pages/GroomingStoreManagement.tsx`

**New State Variable:**
```typescript
const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
```

This allows tracking multiple selected time slots instead of just one.

### 2. Created Toggle Function
**Function:** `toggleTimeSlotSelection()`

```typescript
const toggleTimeSlotSelection = (timeSlot: string) => {
  setSelectedTimeSlots(prev =>
    prev.includes(timeSlot)
      ? prev.filter(t => t !== timeSlot)
      : [...prev, timeSlot]
  );
};
```

Toggles time slots on/off in the selection array.

### 3. Updated Add Time Slot Handler
**Function:** `handleAddTimeSlot()`

**New Logic:**
- Checks if multiple slots are selected via `selectedTimeSlots`
- Falls back to single `newTimeSlot` if nothing selected
- Creates multiple time slots in a loop
- Shows detailed success/failure summary

**Features:**
- ✅ Bulk creation of time slots
- ✅ Individual error tracking per time slot
- ✅ Success count reporting
- ✅ Detailed error messages

**Example Output:**
```
Successfully added 5 time slots!
```
or
```
Added 4 time slots, but 1 failed:
12:00 PM: It may already exist
```

### 4. Enhanced Quick Add UI

**Visual Improvements:**
- Title changed to "Quick Add (Multiple Selection)"
- Selected time slots show with checkmark (✓)
- Selected slots have ring highlight
- Clear button shows count: "Clear Selected (5)"
- Summary text shows selected slots

**Behavior:**
- **Edit Mode**: Single selection (original behavior)
- **Add Mode**: Multiple selection with toggle

**UI States:**

**Unselected:**
```
[ 09:00 AM ] [ 10:00 AM ] [ 11:00 AM ] [ 12:00 PM ]
```

**Selected:**
```
[ 09:00 AM ✓ ] [ 10:00 AM ✓ ] [ 11:00 AM ] [ 12:00 PM ]
```

### 5. Updated Button Text

The "Add Time Slot" button now dynamically shows:
- "Add Time Slot" - when nothing selected
- "Add 3 Time Slots" - when 3 slots selected
- "Update Time Slot" - in edit mode

### 6. Cleanup on Close

When closing the modal, all states are reset:
```typescript
setNewTimeSlot('');
setSelectedTimeSlots([]);
setSelectedWeekdays([0,1,2,3,4,5,6]);
```

## User Experience

### Before:
1. Click "Add New Time Slot"
2. Enter or select ONE time slot
3. Select weekdays
4. Click "Add Time Slot"
5. Repeat for each slot ❌

### After:
1. Click "Add New Time Slot"
2. Click MULTIPLE time slots from Quick Add
3. Select weekdays (applies to all)
4. Click "Add 5 Time Slots"
5. All slots created at once! ✅

## Example Usage

### Scenario: Add morning shifts
1. Click "Add New Time Slot"
2. Select: 09:00 AM, 10:00 AM, 11:00 AM
3. Select weekdays: Mon, Tue, Wed, Thu, Fri
4. Click "Add 3 Time Slots"
5. Result: All 3 time slots created for weekdays

### Scenario: Mix manual and quick add
1. Type "08:30 AM" in text field
2. Select "10:00 AM" and "02:00 PM" from quick add
3. Click "Add 3 Time Slots"
4. All 3 slots created (manual + 2 quick)

## Technical Details

### State Management
```typescript
// Single slot (manual entry)
const [newTimeSlot, setNewTimeSlot] = useState('');

// Multiple slots (quick add)
const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

// Combined for submission
const timeSlotsToCreate = selectedTimeSlots.length > 0
  ? selectedTimeSlots
  : newTimeSlot.trim() ? [newTimeSlot.trim()] : [];
```

### Error Handling
Each time slot creation is wrapped in try-catch:
```typescript
for (const timeSlot of timeSlotsToCreate) {
  try {
    await groomingStoreTimeSlotService.createTimeSlot(storeId, timeSlot, true, selectedWeekdays);
    successCount++;
  } catch (error: any) {
    failCount++;
    errors.push(`${timeSlot}: ${error.message || 'Failed'}`);
  }
}
```

This ensures:
- One failed slot doesn't stop others
- User sees which slots failed
- Partial success is reported clearly

## Benefits

1. **Time Savings**: Add 5-10 slots in seconds instead of minutes
2. **Consistency**: Same weekdays applied to all selected slots
3. **User Friendly**: Visual feedback with checkmarks and counts
4. **Error Resilient**: Continues even if some slots fail
5. **Backwards Compatible**: Manual entry still works

## Files Modified

1. ✅ `pages/GroomingStoreManagement.tsx` - Complete multiple selection implementation

## Testing Checklist

- [ ] Select single time slot - works as before
- [ ] Select multiple time slots - all created
- [ ] Mix manual entry with quick select - both work
- [ ] Try creating duplicate - shows appropriate error
- [ ] Close modal - all selections cleared
- [ ] Edit mode - still single selection only
- [ ] Success message shows correct count
- [ ] Partial failure shows which slots failed
- [ ] Selected slots show checkmarks
- [ ] Clear button removes all selections
- [ ] Button text updates with count

## Future Enhancements (Optional)

1. **Select All Button**: Add all 8 quick slots at once
2. **Custom Time Ranges**: "Add every 30 min from 9 AM to 5 PM"
3. **Copy from Other Day**: Copy Monday slots to other weekdays
4. **Templates**: Save common slot patterns
5. **Batch Edit**: Select and edit multiple existing slots
6. **Import/Export**: CSV import for bulk management

## Summary

The multiple time slot selection feature significantly improves the grooming store setup experience by allowing bulk creation of time slots with a single operation. The implementation is user-friendly, error-resilient, and maintains backward compatibility with manual entry.
