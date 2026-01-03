# Supabase SQL Editor Guide

## How to Run the Migration

### Visual Guide:

```
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE DASHBOARD                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐                                            │
│  │ 🏠 Home    │                                            │
│  ├────────────┤                                            │
│  │ 📊 Table   │                                            │
│  │   Editor   │                                            │
│  ├────────────┤                                            │
│  │ 🔧 SQL     │ ← CLICK HERE                              │
│  │   Editor   │                                            │
│  ├────────────┤                                            │
│  │ 🔐 Auth    │                                            │
│  ├────────────┤                                            │
│  │ 📦 Storage │                                            │
│  └────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step:

#### 1. Navigate to Supabase
- Go to: https://supabase.com/dashboard
- Your project: `kfnsqbgwqltbltngwbdh.supabase.co`

#### 2. Open SQL Editor
```
Dashboard > SQL Editor (left sidebar)
```

#### 3. Create New Query
```
Click: "+ New query" button (top right)
```

#### 4. Paste the SQL
Copy this code:
```sql
ALTER TABLE public.doctor_availability
ADD COLUMN IF NOT EXISTS weekday INTEGER
CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));

CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday
ON public.doctor_availability (weekday);
```

#### 5. Run the Query
```
Click: "RUN" button
or
Press: Ctrl + Enter (Windows/Linux)
Press: Cmd + Enter (Mac)
```

#### 6. Verify Success
You should see:
```
✓ Success. No rows returned
```

---

## Screenshot Reference

### What You'll See:

```
┌─────────────────────────────────────────────────────────────┐
│  SQL Editor                                    [ + New ]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1  ALTER TABLE public.doctor_availability                 │
│  2  ADD COLUMN IF NOT EXISTS weekday INTEGER               │
│  3  CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));│
│  4                                                          │
│  5  CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday│
│  6  ON public.doctor_availability (weekday);               │
│                                                             │
│                                                             │
│  [ Cancel ]                                   [ RUN ]       │
└─────────────────────────────────────────────────────────────┘
```

### After Running:

```
┌─────────────────────────────────────────────────────────────┐
│  Results                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Success. No rows returned                               │
│                                                             │
│  Rows: 0                                                    │
│  Time: 24ms                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete SQL Script

Here's the complete script with all safeguards:

```sql
-- ========================================
-- Add weekday column to doctor_availability
-- Safe to run multiple times
-- ========================================

-- Step 1: Add the weekday column
ALTER TABLE public.doctor_availability
ADD COLUMN IF NOT EXISTS weekday INTEGER
CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday
ON public.doctor_availability (weekday);

-- Step 3: Add helpful comment
COMMENT ON COLUMN public.doctor_availability.weekday
IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- Step 4: Verify (optional)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor_availability'
  AND column_name = 'weekday';
```

---

## Alternative: Using Table Editor

If you prefer a visual approach:

1. Go to **Table Editor** (left sidebar)
2. Find table: `doctor_availability`
3. Click **"+ New Column"**
4. Configure:
   - Name: `weekday`
   - Type: `int4` (integer)
   - Nullable: ✓ (checked)
   - Default: (leave empty)
5. Click **Save**
6. Then run this in SQL Editor for the constraint:
```sql
ALTER TABLE public.doctor_availability
ADD CONSTRAINT doctor_availability_weekday_check
CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));
```

---

## Verification Checklist

After running the migration:

- [ ] No error messages in SQL Editor
- [ ] "Success" message appears
- [ ] Refresh your app
- [ ] Navigate to Doctor → Availability
- [ ] Click "Slot Add" button
- [ ] Modal opens without errors
- [ ] Can select weekdays
- [ ] Can select time slots
- [ ] Click "Create Slots"
- [ ] ✓ Success message appears!

---

## Your Supabase Project Details

- **Project URL**: https://kfnsqbgwqltbltngwbdh.supabase.co
- **Table**: `doctor_availability`
- **New Column**: `weekday` (INTEGER, nullable, 0-6)

---

## Quick Access

Files created for you:
1. **QUICK_FIX.sql** - Minimal 3-line script
2. **ADD_WEEKDAY_COLUMN.sql** - Complete migration with safeguards
3. **FIX_INSTRUCTIONS.md** - Detailed instructions
4. **This file** - Visual guide

Choose whichever method you're most comfortable with!

---

## 🎉 You're Almost There!

Once you run this migration, your "Slot Add" feature will work perfectly! Just:
1. Run the SQL script above
2. Refresh your app
3. Start creating slots with weekday selection!

The entire process takes less than 2 minutes. Let's do this! 🚀
