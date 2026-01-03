-- =====================================================
-- POPULATE TEST DATA FOR DOCTOR DASHBOARD
-- =====================================================
-- This script creates sample data to test the real-time
-- analytics on the Doctor Dashboard
-- =====================================================

\echo '🎯 Populating test data for Doctor Dashboard...'
\echo ''

-- =====================================================
-- STEP 1: Get Doctor ID (DIMPLE KUMAR)
-- =====================================================

\echo '👨‍⚕️ Finding doctor: DIMPLE KUMAR...'

DO $$
DECLARE
  v_doctor_id UUID;
  v_user_id UUID;
  v_pet_id UUID;
  v_booking_id UUID;
  v_address_id UUID;
BEGIN
  -- Get DIMPLE KUMAR's doctor ID
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE full_name = 'DIMPLE KUMAR' OR email LIKE '%dimpl%'
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RAISE NOTICE '❌ Doctor DIMPLE KUMAR not found!';
    RAISE NOTICE 'Please check the doctors table.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found Doctor ID: %', v_doctor_id;

  -- =====================================================
  -- STEP 2: Get or Create Test User
  -- =====================================================

  \echo '👤 Setting up test user...'

  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ No users found. Cannot create test bookings without a user.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Using User ID: %', v_user_id;

  -- =====================================================
  -- STEP 3: Get or Create Test Pet
  -- =====================================================

  \echo '🐕 Setting up test pet...'

  SELECT id INTO v_pet_id FROM pets WHERE user_id = v_user_id LIMIT 1;

  IF v_pet_id IS NULL THEN
    RAISE NOTICE '❌ No pets found for this user. Cannot create test bookings.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Using Pet ID: %', v_pet_id;

  -- =====================================================
  -- STEP 4: Get Address (for home consultations)
  -- =====================================================

  SELECT id INTO v_address_id FROM addresses WHERE user_id = v_user_id LIMIT 1;

  -- =====================================================
  -- STEP 5: Create Test Bookings
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📅 Creating test bookings...';

  -- Booking 1: Today - Completed
  INSERT INTO bookings (
    user_id, pet_id, service_type, booking_type,
    date, time, status, doctor_id,
    payment_status, payment_amount
  ) VALUES (
    v_user_id, v_pet_id, 'consultation', 'online',
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '09:00', 'completed', v_doctor_id,
    'paid', 500.00
  ) RETURNING id INTO v_booking_id;

  RAISE NOTICE '✅ Created completed booking (today): %', v_booking_id;

  -- Create earnings for completed booking
  INSERT INTO doctor_earnings (
    doctor_id, booking_id,
    gross_amount, platform_commission, net_amount, status
  ) VALUES (
    v_doctor_id, v_booking_id,
    500.00, 50.00, 450.00, 'paid'
  );

  RAISE NOTICE '✅ Created earnings record: ₹450 (paid)';

  -- Booking 2: Today - Upcoming
  INSERT INTO bookings (
    user_id, pet_id, service_type, booking_type,
    date, time, status, doctor_id,
    payment_status, payment_amount
  ) VALUES (
    v_user_id, v_pet_id, 'consultation', 'clinic',
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '14:00', 'upcoming', v_doctor_id,
    'pending', 600.00
  ) RETURNING id INTO v_booking_id;

  RAISE NOTICE '✅ Created upcoming booking (today): %', v_booking_id;

  -- Booking 3: This Week - Completed
  INSERT INTO bookings (
    user_id, pet_id, service_type, booking_type,
    date, time, status, doctor_id,
    payment_status, payment_amount
  ) VALUES (
    v_user_id, v_pet_id, 'consultation', 'home',
    TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'), '10:00', 'completed', v_doctor_id,
    'paid', 850.00
  ) RETURNING id INTO v_booking_id;

  RAISE NOTICE '✅ Created completed booking (this week): %', v_booking_id;

  -- Create earnings for this booking
  INSERT INTO doctor_earnings (
    doctor_id, booking_id,
    gross_amount, platform_commission, net_amount, status
  ) VALUES (
    v_doctor_id, v_booking_id,
    850.00, 85.00, 765.00, 'pending'
  );

  RAISE NOTICE '✅ Created earnings record: ₹765 (pending)';

  -- Booking 4: Last Month - For earnings growth
  INSERT INTO bookings (
    user_id, pet_id, service_type, booking_type,
    date, time, status, doctor_id,
    payment_status, payment_amount
  ) VALUES (
    v_user_id, v_pet_id, 'consultation', 'online',
    TO_CHAR(CURRENT_DATE - INTERVAL '35 days', 'YYYY-MM-DD'), '11:00', 'completed', v_doctor_id,
    'paid', 400.00
  ) RETURNING id INTO v_booking_id;

  RAISE NOTICE '✅ Created completed booking (last month): %', v_booking_id;

  -- Create earnings for last month (for growth calculation)
  INSERT INTO doctor_earnings (
    doctor_id, booking_id,
    gross_amount, platform_commission, net_amount, status,
    created_at
  ) VALUES (
    v_doctor_id, v_booking_id,
    400.00, 40.00, 360.00, 'paid',
    CURRENT_DATE - INTERVAL '35 days'
  );

  RAISE NOTICE '✅ Created last month earnings: ₹360';

  -- =====================================================
  -- STEP 6: Create Test Reviews
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '⭐ Creating test reviews...';

  -- Get some completed bookings for reviews
  FOR v_booking_id IN
    SELECT id FROM bookings
    WHERE doctor_id = v_doctor_id
    AND status = 'completed'
    AND id NOT IN (SELECT booking_id FROM doctor_reviews)
    LIMIT 3
  LOOP
    INSERT INTO doctor_reviews (
      doctor_id, user_id, booking_id, rating, review_text
    ) VALUES (
      v_doctor_id, v_user_id, v_booking_id,
      4 + (RANDOM() * 1)::INTEGER,  -- Random rating 4-5
      'Great consultation! Very helpful and professional.'
    );

    RAISE NOTICE '✅ Created review for booking: %', v_booking_id;
  END LOOP;

  -- =====================================================
  -- STEP 7: Verify Data Created
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '🔍 Verifying created data...';
  RAISE NOTICE '';

  -- Check analytics
  PERFORM * FROM get_doctor_analytics(v_doctor_id);

  RAISE NOTICE '📊 Analytics Summary for DIMPLE KUMAR:';
  RAISE NOTICE '════════════════════════════════════════';

  DECLARE
    analytics_record RECORD;
  BEGIN
    SELECT * INTO analytics_record FROM get_doctor_analytics(v_doctor_id);

    RAISE NOTICE 'Today Total: %', analytics_record.today_total;
    RAISE NOTICE 'Today Completed: %', analytics_record.today_completed;
    RAISE NOTICE 'Today Upcoming: %', analytics_record.today_upcoming;
    RAISE NOTICE 'This Week: %', analytics_record.week_total;
    RAISE NOTICE 'All Time Total: %', analytics_record.total_consultations;
    RAISE NOTICE 'Total Earnings: ₹%', analytics_record.total_earnings;
    RAISE NOTICE 'Paid Earnings: ₹%', analytics_record.paid_earnings;
    RAISE NOTICE 'Pending Earnings: ₹%', analytics_record.pending_earnings;
    RAISE NOTICE 'Rating: %', analytics_record.rating;
    RAISE NOTICE 'Earnings Growth: %', calculate_earnings_growth(v_doctor_id) || '%';
  END;

  RAISE NOTICE '════════════════════════════════════════';

END $$;

\echo ''
\echo '==============================================='
\echo '✅ TEST DATA CREATION COMPLETE!'
\echo '==============================================='
\echo ''
\echo '🎯 Next Steps:'
\echo '1. Refresh your Doctor Dashboard'
\echo '2. You should now see:'
\echo '   - Today Total: 2 consultations'
\echo '   - This Week: 3 consultations'
\echo '   - Total Earnings: ₹1,215'
\echo '   - Rating: 4.5+ stars'
\echo '   - Earnings Growth: positive %'
\echo ''
\echo '💡 If data still shows 0:'
\echo '   - Hard refresh browser (Ctrl+Shift+R)'
\echo '   - Check browser console for errors'
\echo '   - Verify doctor ID matches logged-in user'
\echo ''
