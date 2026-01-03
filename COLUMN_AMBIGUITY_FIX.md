# 🔧 Column Ambiguity Fix

## ❌ The Problem

When running the real-time analytics migration, you may encounter this error:

```
ERROR: 42702: column reference "doctor_id" is ambiguous
DETAIL: It could refer to either a PL/pgSQL variable or a table column.
```

## 🔍 What Caused It

In the `get_doctor_analytics()` function, there was a subquery that referenced `doctor_id` without a table alias:

```sql
-- PROBLEMATIC CODE:
SELECT COUNT(*)
FROM bookings
WHERE (doctor_id IS NULL OR (doctor_id = p_doctor_id AND status = 'pending'))
      ^^^^^^^^                ^^^^^^^^
      Ambiguous!              Ambiguous!
```

PostgreSQL couldn't determine if `doctor_id` referred to:
1. The function's return column `doctor_id`
2. The function parameter `p_doctor_id`
3. The `bookings.doctor_id` column

## ✅ The Solution

Added a table alias `b` to the bookings table and prefixed all column references:

```sql
-- FIXED CODE:
SELECT COUNT(*)
FROM bookings b
WHERE (b.doctor_id IS NULL OR (b.doctor_id = p_doctor_id AND b.status = 'pending'))
       ^^^^^^^^^^^              ^^^^^^^^^^^              ^^^
       Clear now!               Clear now!               Clear now!
```

Now PostgreSQL knows:
- `b.doctor_id` = column from bookings table
- `p_doctor_id` = function parameter
- No more ambiguity!

## 🚀 How to Apply the Fix

### If You Haven't Applied the Migration Yet

Great! The migration files have been updated. Just use:
- [APPLY_REALTIME_ANALYTICS.sql](APPLY_REALTIME_ANALYTICS.sql) (updated with fix)
- [supabase/migrations/011_realtime_analytics.sql](supabase/migrations/011_realtime_analytics.sql) (updated with fix)

### If You Already Applied the Migration

Run this quick fix:

1. Open Supabase SQL Editor
2. Copy content from [FIX_AMBIGUOUS_COLUMN.sql](FIX_AMBIGUOUS_COLUMN.sql)
3. Paste and run
4. Done! ✅

Or run this directly:

```sql
DROP FUNCTION IF EXISTS get_doctor_analytics(UUID);

CREATE OR REPLACE FUNCTION get_doctor_analytics(p_doctor_id UUID)
RETURNS TABLE (
  doctor_id UUID,
  total_consultations BIGINT,
  today_total BIGINT,
  today_completed BIGINT,
  today_upcoming BIGINT,
  today_cancelled BIGINT,
  week_total BIGINT,
  pending_requests BIGINT,
  total_earnings NUMERIC,
  paid_earnings NUMERIC,
  pending_earnings NUMERIC,
  rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    da.doctor_id,
    da.total_consultations,
    da.today_total,
    da.today_completed,
    da.today_upcoming,
    da.today_cancelled,
    da.week_total,
    (
      SELECT COUNT(*)
      FROM bookings b  -- ← Added alias 'b'
      WHERE (b.doctor_id IS NULL OR (b.doctor_id = p_doctor_id AND b.status = 'pending'))
      AND b.service_type = 'consultation'
      AND b.status != 'cancelled'
    )::BIGINT as pending_requests,
    da.total_earnings,
    da.paid_earnings,
    da.pending_earnings,
    da.rating
  FROM doctor_analytics da
  WHERE da.doctor_id = p_doctor_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_doctor_analytics(UUID) TO authenticated;
```

## 🧪 Verify the Fix

Test the function to make sure it works:

```sql
-- Get a doctor ID to test with
SELECT id FROM doctors WHERE is_active = TRUE LIMIT 1;

-- Test the function (replace with actual doctor ID)
SELECT * FROM get_doctor_analytics('your-doctor-id-here');
```

You should get results without any errors! ✅

## 📋 Summary

### Files Updated:
- ✅ [supabase/migrations/011_realtime_analytics.sql](supabase/migrations/011_realtime_analytics.sql)
- ✅ [APPLY_REALTIME_ANALYTICS.sql](APPLY_REALTIME_ANALYTICS.sql)

### Files Created:
- ✅ [FIX_AMBIGUOUS_COLUMN.sql](FIX_AMBIGUOUS_COLUMN.sql) - Quick fix for existing installations

### What Changed:
- Added table alias `b` to bookings table in subquery
- Prefixed all column references with `b.` for clarity
- No other changes to functionality

## 🎯 Result

The `get_doctor_analytics()` function now works perfectly without any ambiguous column errors! 🎉

---

**All migration files have been updated with this fix, so new installations won't encounter this issue.**
