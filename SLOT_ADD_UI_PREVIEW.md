# Slot Add Feature - UI Preview

## Button Location

The new **"Slot Add"** button appears in the schedule header:

```
┌─────────────────────────────────────────────────────┐
│  ← Availability & Slots                          ⚙  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┬──────────┬──────────┐               │
│  │ 🏪 Clinic │   Home   │  Online  │               │
│  └──────────┴──────────┴──────────┘               │
│                                                     │
│  December 2025                    ◀ ▶              │
│                                                     │
│  ┌──────┬──────┬──────┬──────┬──────┐            │
│  │  Mon │  Tue │  Wed │  Thu │  Fri │            │
│  │   1  │   2  │   3  │   4  │   5  │            │
│  └──────┴──────┴──────┴──────┴──────┘            │
│                                                     │
│  SCHEDULE • CLINIC                                 │
│                    ┌─────────────┐  ┌───────────┐ │
│                    │ 📅 Slot Add │  │ + Quick   │ │
│                    └─────────────┘  │   Add     │ │
│                                      └───────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Modal Interface

When clicking **"Slot Add"**, a beautiful modal slides up:

```
┌─────────────────────────────────────────────────────┐
│  Quick Add Availability                          ✕  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🏪  Clinic Visit                              │ │
│  │     Setting availability for clinic           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Select Days                                        │
│  ┌───┬───┬───┬───┬───┬───┬───┐                   │
│  │ S │ M │ T │ W │ T │ F │ S │                   │
│  └───┴─█─┴───┴─█─┴─█─┴───┴───┘                   │
│     (Mon, Wed, Fri selected)                       │
│                                                     │
│  Select Time Slots                                  │
│  ┌────────────────────────────────────────┐       │
│  │ ┌────────┬────────┬────────┐          │       │
│  │ │ 8:00 AM│ 8:30 AM│ 9:00 AM│ ✓        │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │ 9:30 AM│10:00 AM│10:30 AM│          │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │11:00 AM│11:30 AM│12:00 PM│          │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │12:30 PM│ 1:00 PM│ 1:30 PM│          │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │ 2:00 PM│ 2:30 PM│ 3:00 PM│ ✓        │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │ 3:30 PM│ 4:00 PM│ 4:30 PM│          │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │ 5:00 PM│ 5:30 PM│ 6:00 PM│ ✓        │       │
│  │ ├────────┼────────┼────────┤          │       │
│  │ │ 6:30 PM│ 7:00 PM│ 7:30 PM│          │       │
│  │ └────────┴────────┴────────┘          │       │
│  └────────────────────────────────────────┘       │
│                 (scrollable)                       │
│                                                     │
│  Capacity per Slot                                  │
│       ┌───┐    ┌───┐    ┌───┐                     │
│       │ − │    │ 2 │    │ + │                     │
│       └───┘    └───┘    └───┘                     │
│              pets per slot                         │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Summary                                       │ │
│  │ Creating 3 × 3 = 9 slots                     │ │
│  │ 2 pets per slot                              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          📅  Create Slots                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Selected State Example

### Weekdays Selected: Mon, Wed, Fri
```
┌───┬───┬───┬───┬───┬───┬───┐
│ S │ M │ T │ W │ T │ F │ S │
└───┴─█─┴───┴─█─┴─█─┴───┴───┘
     ^^^     ^^^  ^^^
   (Blue)  (Blue)(Blue)
```

### Time Slots Selected: 9:00 AM, 2:00 PM, 6:00 PM
```
┌────────┬────────┬────────┐
│ 8:00 AM│ 8:30 AM│ 9:00 AM│ ← 9:00 AM selected (Blue)
├────────┼────────┼────────┤
│ 9:30 AM│10:00 AM│10:30 AM│
├────────┼────────┼────────┤
│11:00 AM│11:30 AM│12:00 PM│
├────────┼────────┼────────┤
│12:30 PM│ 1:00 PM│ 1:30 PM│
├────────┼────────┼────────┤
│ 2:00 PM│ 2:30 PM│ 3:00 PM│ ← 2:00 PM selected (Blue)
├────────┼────────┼────────┤
│ 3:30 PM│ 4:00 PM│ 4:30 PM│
├────────┼────────┼────────┤
│ 5:00 PM│ 5:30 PM│ 6:00 PM│ ← 6:00 PM selected (Blue)
└────────┴────────┴────────┘
```

### Capacity: 2 pets
```
┌───┐    ┌───┐    ┌───┐
│ − │    │ 2 │    │ + │
└───┘    └───┘    └───┘
       pets per slot
```

### Summary Calculation
```
┌─────────────────────────────────┐
│ Summary                         │
│                                 │
│ Creating 3 × 3 = 9 slots       │
│ (3 days × 3 times per week)    │
│                                 │
│ 2 pets per slot                 │
└─────────────────────────────────┘
```

---

## Created Slots View

After clicking "Create Slots", the calendar shows the new availability:

```
┌─────────────────────────────────────────────────────┐
│  SCHEDULE • CLINIC                                   │
│                                                      │
│  9:00  ┌────────────────────────────────────────┐  │
│   AM   │  9:00 AM - 9:30 AM          [2 left]  │  │
│        │  Capacity: 0/2 pets                 ✕  │  │
│        └────────────────────────────────────────┘  │
│                                                      │
│  2:00  ┌────────────────────────────────────────┐  │
│   PM   │  2:00 PM - 2:30 PM          [2 left]  │  │
│        │  Capacity: 0/2 pets                 ✕  │  │
│        └────────────────────────────────────────┘  │
│                                                      │
│  6:00  ┌────────────────────────────────────────┐  │
│   PM   │  6:00 PM - 6:30 PM          [2 left]  │  │
│        │  Capacity: 0/2 pets                 ✕  │  │
│        └────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Light Mode:
- **Primary Blue**: `#0066CC` (Selected state, buttons)
- **Background**: `#FFFFFF` (Cards, modal)
- **Text**: `#1E293B` (Primary text)
- **Muted**: `#64748B` (Secondary text)
- **Border**: `#E2E8F0` (Dividers)

### Dark Mode:
- **Primary Blue**: `#0066CC` (Selected state, buttons)
- **Background**: `#1E293B` (Cards, modal)
- **Surface**: `#334155` (Raised elements)
- **Text**: `#F1F5F9` (Primary text)
- **Muted**: `#94A3B8` (Secondary text)
- **Border**: `#475569` (Dividers)

---

## Interaction States

### Weekday Button:
```
┌───────────────────────────────────┐
│ Unselected:                       │
│   Background: Gray (#F1F5F9)      │
│   Text: Slate (#64748B)           │
│   Hover: Darker gray              │
│                                   │
│ Selected:                         │
│   Background: Primary (#0066CC)   │
│   Text: White (#FFFFFF)           │
│   Shadow: Blue glow               │
│   Scale: Slightly larger (1.05x) │
└───────────────────────────────────┘
```

### Time Slot Button:
```
┌───────────────────────────────────┐
│ Unselected:                       │
│   Background: Gray (#F1F5F9)      │
│   Text: Slate (#64748B)           │
│   Size: Regular                   │
│                                   │
│ Selected:                         │
│   Background: Primary (#0066CC)   │
│   Text: White (#FFFFFF)           │
│   Shadow: Medium                  │
└───────────────────────────────────┘
```

### Create Button:
```
┌───────────────────────────────────┐
│ Normal:                           │
│   Background: Primary (#0066CC)   │
│   Text: White                     │
│   Shadow: Blue glow               │
│                                   │
│ Hover:                            │
│   Background: Darker (#013D63)    │
│   Shadow: Stronger                │
│                                   │
│ Disabled:                         │
│   Opacity: 50%                    │
│   Cursor: Not allowed             │
└───────────────────────────────────┘
```

---

## Loading State

When creating slots:

```
┌─────────────────────────────────────────┐
│                                         │
│           ⟳ (spinning)                  │
│                                         │
│        Creating slots...                │
│     This may take a moment              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Success Message

After successful creation:

```
┌─────────────────────────────────────────┐
│  ✓ Success!                             │
│                                         │
│  Successfully created 9 slots per week  │
│  for 4 weeks!                          │
│                                         │
│  Total: 36 slots created               │
│                                         │
│              [ OK ]                     │
└─────────────────────────────────────────┘
```

---

## Mobile Responsive

On mobile devices, the modal takes full screen:

```
┌─────────────────────────┐
│ Quick Add Availability ✕│
├─────────────────────────┤
│                         │
│ [Full screen modal]     │
│                         │
│ - Weekdays stack        │
│ - Time slots in 2 cols  │
│ - Touch-friendly        │
│ - Swipeable             │
│                         │
│ [ Create Slots ]        │
│                         │
└─────────────────────────┘
```

---

## Complete Flow Diagram

```
User Journey:
┌──────────────────────────────────────────────────┐
│ 1. Doctor opens "Availability & Slots" page     │
│    └─> Sees calendar with existing slots        │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 2. Clicks "Slot Add" button                     │
│    └─> Modal slides up from bottom               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 3. Selects weekdays (Mon, Wed, Fri)             │
│    └─> Buttons turn blue                         │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 4. Selects time slots (9:00 AM, 2:00 PM)        │
│    └─> Slots highlighted in blue                 │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 5. Adjusts capacity (2 pets)                    │
│    └─> +/- buttons                               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 6. Reviews summary                               │
│    └─> "Creating 3 × 2 = 6 slots"               │
│    └─> "2 pets per slot"                        │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 7. Clicks "Create Slots"                        │
│    └─> Loading spinner appears                   │
│    └─> API creates 6 slots × 4 weeks = 24       │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 8. Success message appears                       │
│    └─> "Successfully created 6 slots per week!"  │
│    └─> Modal closes                              │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 9. Calendar refreshes                            │
│    └─> Shows all newly created slots             │
│    └─> Doctor can now book appointments          │
└──────────────────────────────────────────────────┘
```

---

This UI provides a professional, intuitive way to manage recurring availability with just a few clicks! 🎉
