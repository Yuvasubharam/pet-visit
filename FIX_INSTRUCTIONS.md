# Fix Instructions - Add Weekday Column

## The Error
```
Error creating availability: 400 Bad Request
Column "weekday" does not exist in table "doctor_availability"
```

## Solution: Add the weekday column to your database

---

## ⚡ Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `kfnsqbgwqltbltngwbdh`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run This SQL Script

Copy and paste this entire code into the SQL editor:

```sql
-- Add the weekday column
ALTER TABLE public.doctor_availability
ADD COLUMN IF NOT EXISTS weekday INTEGER
CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday
ON public.doctor_availability (weekday);

-- Add helpful comment
COMMENT ON COLUMN public.doctor_availability.weekday
IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
```

### Step 3: Execute
Click **"RUN"** button (or press Ctrl+Enter)

### Step 4: Verify
You should see:
```
Success. No rows returned
```

### Step 5: Test the App
1. Refresh your pet-visit app
2. Navigate to Doctor → Availability & Slots
3. Click the blue **"Slot Add"** button
4. Select weekdays and time slots
5. Click "Create Slots"
6. ✅ It should work now!

---

## 📋 Alternative: Full Migration Script

If you want to run the complete migration with all safeguards, use the file:
**`ADD_WEEKDAY_COLUMN.sql`**

This includes:
- Safe column addition with IF NOT EXISTS
- Proper constraints
- Index creation
- Verification queries

---

## 🔍 Verification Query

After running the migration, verify it worked:

```sql
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor_availability'
    AND column_name = 'weekday';
```

Expected result:
```
column_name | data_type | is_nullable
weekday     | integer   | YES
```

---

## ✅ What This Does

The migration adds a new column to track the day of the week for recurring availability:

- **Column Name**: `weekday`
- **Type**: INTEGER (0-6)
- **Values**:
  - 0 = Sunday
  - 1 = Monday
  - 2 = Tuesday
  - 3 = Wednesday
  - 4 = Thursday
  - 5 = Friday
  - 6 = Saturday
- **Nullable**: YES (NULL for date-specific slots)
- **Constraint**: Must be between 0 and 6

---

## 🎯 Why This Column?

This column allows the system to:
1. Create recurring weekly availability (e.g., "Every Monday at 9:00 AM")
2. Generate slots for multiple weeks at once
3. Support both date-specific and recurring schedules
4. Efficiently query availability by day of week

---

## 🚨 Troubleshooting

### If you get "permission denied"
Make sure you're logged into the correct Supabase project with admin access.

### If you get "column already exists"
That's fine! The migration is already applied. Just refresh your app.

### If you get "relation does not exist"
Make sure you're running the query on the correct database/project.

### If the app still shows errors after migration
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for new errors

---

## 📞 Need Help?

The migration file is ready at:
- **Quick Fix**: `QUICK_FIX.sql` (3 lines, simple)
- **Full Migration**: `ADD_WEEKDAY_COLUMN.sql` (comprehensive, with safeguards)

Both will work. The quick fix is faster, the full migration is safer.

---

## ✨ After Migration

Once the column is added, you'll be able to:
- ✅ Select multiple weekdays (Mon, Wed, Fri)
- ✅ Choose time slots with 30-min intervals
- ✅ Create recurring availability for 4 weeks
- ✅ Automatically generate all slot combinations
- ✅ See slots appear in your calendar

Example:
- Select: Mon, Wed, Fri
- Time: 9:00 AM, 2:00 PM
- Capacity: 2 pets
- Result: **3 days × 2 times × 4 weeks = 24 slots created!**

Happy scheduling! 🎉
