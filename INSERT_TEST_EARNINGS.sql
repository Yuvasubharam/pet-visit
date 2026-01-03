-- =====================================================
-- MANUAL TEST DATA INSERTION
-- =====================================================
-- Use this to manually insert test earnings and reviews
-- Replace the UUIDs with your actual IDs
-- =====================================================

-- =====================================================
-- STEP 1: Get Your IDs
-- =====================================================

-- Find your doctor ID
SELECT id, full_name, email FROM doctors WHERE is_active = TRUE;

-- Find a user ID
SELECT id, name, email FROM users LIMIT 5;

-- Find a pet ID
SELECT id, name, species FROM pets LIMIT 5;

-- =====================================================
-- STEP 2: Create a Test Booking (REPLACE IDs!)
-- =====================================================

-- Replace these with actual IDs from Step 1
/*
INSERT INTO bookings (
  user_id,
  pet_id,
  service_type,
  booking_type,
  date,
  time,
  status,
  doctor_id,
  payment_status,
  payment_amount
) VALUES (
  'YOUR_USER_ID',      -- Replace with actual user ID
  'YOUR_PET_ID',       -- Replace with actual pet ID
  'consultation',
  'online',
  TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
  '10:00',
  'completed',
  'YOUR_DOCTOR_ID',    -- Replace with your doctor ID
  'paid',
  500.00
) RETURNING id;
*/

-- Save the returned booking_id for next step!

-- =====================================================
-- STEP 3: Create Doctor Earnings (REPLACE IDs!)
-- =====================================================

-- Replace with your doctor ID and booking ID from above
/*
INSERT INTO doctor_earnings (
  doctor_id,
  booking_id,
  gross_amount,
  platform_commission,
  net_amount,
  status
) VALUES (
  'YOUR_DOCTOR_ID',    -- Replace with your doctor ID
  'YOUR_BOOKING_ID',   -- Replace with booking ID from Step 2
  500.00,              -- Service fee
  50.00,               -- Platform commission (10%)
  450.00,              -- Net amount (500 - 50)
  'paid'               -- Status: 'paid' or 'pending'
);
*/

-- =====================================================
-- STEP 4: Create a Review (REPLACE IDs!)
-- =====================================================

-- Replace with your IDs
/*
INSERT INTO doctor_reviews (
  doctor_id,
  user_id,
  booking_id,
  rating,
  review_text
) VALUES (
  'YOUR_DOCTOR_ID',    -- Replace with your doctor ID
  'YOUR_USER_ID',      -- Replace with user ID
  'YOUR_BOOKING_ID',   -- Replace with booking ID from Step 2
  5,                   -- Rating 1-5
  'Excellent consultation! Very professional and caring.'
);
*/

-- =====================================================
-- STEP 5: Verify Analytics Updated
-- =====================================================

-- Check analytics (replace with your doctor ID)
-- SELECT * FROM get_doctor_analytics('YOUR_DOCTOR_ID');

-- =====================================================
-- QUICK INSERT EXAMPLE (Copy and customize)
-- =====================================================

-- 1. Get IDs first
DO $$
DECLARE
  v_doctor_id UUID;
  v_user_id UUID;
  v_pet_id UUID;
BEGIN
  SELECT id INTO v_doctor_id FROM doctors WHERE is_active = TRUE LIMIT 1;
  SELECT id INTO v_user_id FROM users LIMIT 1;
  SELECT id INTO v_pet_id FROM pets LIMIT 1;

  RAISE NOTICE 'Doctor ID: %', v_doctor_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Pet ID: %', v_pet_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Copy these IDs and use them in the INSERT statements above!';
END $$;

-- =====================================================
-- ALTERNATIVE: Use This Transaction (SAFER)
-- =====================================================

-- This will insert all data in one transaction
-- If anything fails, everything rolls back

/*
BEGIN;

-- Get IDs
WITH ids AS (
  SELECT
    (SELECT id FROM doctors WHERE is_active = TRUE LIMIT 1) as doctor_id,
    (SELECT id FROM users LIMIT 1) as user_id,
    (SELECT id FROM pets LIMIT 1) as pet_id
)
-- Create booking
INSERT INTO bookings (user_id, pet_id, service_type, booking_type, date, time, status, doctor_id, payment_status, payment_amount)
SELECT user_id, pet_id, 'consultation', 'online', TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '10:00', 'completed', doctor_id, 'paid', 500.00
FROM ids
RETURNING id;

-- Save the booking ID shown above, then:

-- Create earnings (replace BOOKING_ID)
WITH ids AS (
  SELECT
    (SELECT id FROM doctors WHERE is_active = TRUE LIMIT 1) as doctor_id
)
INSERT INTO doctor_earnings (doctor_id, booking_id, gross_amount, platform_commission, net_amount, status)
SELECT doctor_id, 'BOOKING_ID'::UUID, 500.00, 50.00, 450.00, 'paid'
FROM ids;

-- Create review (replace BOOKING_ID)
WITH ids AS (
  SELECT
    (SELECT id FROM doctors WHERE is_active = TRUE LIMIT 1) as doctor_id,
    (SELECT id FROM users LIMIT 1) as user_id
)
INSERT INTO doctor_reviews (doctor_id, user_id, booking_id, rating, review_text)
SELECT doctor_id, user_id, 'BOOKING_ID'::UUID, 5, 'Great service!'
FROM ids;

COMMIT;
*/

-- =====================================================
-- NOTES
-- =====================================================

-- After inserting data:
-- 1. The triggers will automatically update doctor stats
-- 2. Refresh your dashboard to see the changes
-- 3. Hard refresh browser if needed (Ctrl+Shift+R)

-- To check if data was inserted:
-- SELECT * FROM bookings WHERE service_type = 'consultation' ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM doctor_earnings ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM doctor_reviews ORDER BY created_at DESC LIMIT 5;
