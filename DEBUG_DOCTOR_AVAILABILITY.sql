-- ============================================================================
-- DEBUG DOCTOR AVAILABILITY
-- ============================================================================
-- This script helps you understand why doctors aren't appearing
-- ============================================================================

-- Step 1: Check what dates we have availability for
-- ----------------------------------------------------------------------------

SELECT
  date,
  slot_type,
  COUNT(*) as slot_count,
  MIN(start_time) as earliest_slot,
  MAX(start_time) as latest_slot
FROM doctor_availability
WHERE is_active = TRUE
GROUP BY date, slot_type
ORDER BY date, slot_type;

-- Step 2: Check today's date in the database
-- ----------------------------------------------------------------------------

SELECT
  CURRENT_DATE as current_date,
  CURRENT_DATE::TEXT as current_date_as_text,
  NOW() as current_timestamp;

-- Step 3: Show all availability slots with details
-- ----------------------------------------------------------------------------

SELECT
  da.id,
  d.full_name as doctor_name,
  da.date,
  da.start_time,
  da.end_time,
  da.slot_type,
  da.capacity,
  da.booked_count,
  da.is_active,
  CASE
    WHEN da.date < CURRENT_DATE::TEXT THEN 'PAST'
    WHEN da.date = CURRENT_DATE::TEXT THEN 'TODAY'
    ELSE 'FUTURE'
  END as date_status,
  CASE
    WHEN da.booked_count >= da.capacity THEN 'FULLY BOOKED'
    ELSE 'AVAILABLE'
  END as booking_status
FROM doctor_availability da
JOIN doctors d ON d.id = da.doctor_id
WHERE d.is_active = TRUE
ORDER BY da.date, da.start_time;

-- Step 4: Count slots by date status
-- ----------------------------------------------------------------------------

SELECT
  CASE
    WHEN date < CURRENT_DATE::TEXT THEN 'PAST'
    WHEN date = CURRENT_DATE::TEXT THEN 'TODAY'
    ELSE 'FUTURE'
  END as date_category,
  slot_type,
  COUNT(*) as slot_count
FROM doctor_availability
WHERE is_active = TRUE
GROUP BY date_category, slot_type
ORDER BY date_category, slot_type;

-- Step 5: Test the exact query used by the app
-- ----------------------------------------------------------------------------
-- Replace '2026-01-01' with today's date or the date you're testing

DO $$
DECLARE
  test_date TEXT := '2026-01-01'; -- CHANGE THIS TO THE DATE YOU'RE TESTING
  test_slot_type TEXT := 'online'; -- CHANGE THIS TO: 'online', 'home', or 'clinic'
  slot_count INTEGER;
BEGIN
  RAISE NOTICE 'Testing for date: %, slot_type: %', test_date, test_slot_type;

  SELECT COUNT(*) INTO slot_count
  FROM doctor_availability
  WHERE date = test_date
    AND slot_type = test_slot_type
    AND is_active = TRUE
    AND booked_count < capacity;

  RAISE NOTICE 'Found % available slots', slot_count;

  IF slot_count = 0 THEN
    RAISE WARNING 'No slots found! Check the date and slot_type values.';
  END IF;
END $$;

-- Step 6: Show what the app would see for the next 7 days
-- ----------------------------------------------------------------------------

WITH date_range AS (
  SELECT
    (CURRENT_DATE + interval '0 days')::DATE + i as test_date
  FROM generate_series(0, 6) i
)
SELECT
  dr.test_date::TEXT as date,
  COUNT(DISTINCT CASE WHEN da.slot_type = 'online' THEN da.id END) as online_slots,
  COUNT(DISTINCT CASE WHEN da.slot_type = 'home' THEN da.id END) as home_slots,
  COUNT(DISTINCT CASE WHEN da.slot_type = 'clinic' THEN da.id END) as clinic_slots,
  COUNT(DISTINCT da.doctor_id) as doctors_available
FROM date_range dr
LEFT JOIN doctor_availability da
  ON da.date = dr.test_date::TEXT
  AND da.is_active = TRUE
  AND da.booked_count < da.capacity
GROUP BY dr.test_date
ORDER BY dr.test_date;
