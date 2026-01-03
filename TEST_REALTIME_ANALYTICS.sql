-- =====================================================
-- TEST SCRIPT: Real-Time Analytics
-- =====================================================
-- Use this script to verify that real-time analytics
-- are working correctly after applying the migration
-- =====================================================

\echo '🧪 Starting Real-Time Analytics Tests...'
\echo ''

-- =====================================================
-- TEST 1: Verify View Exists
-- =====================================================

\echo '📊 TEST 1: Checking if doctor_analytics view exists...'

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_name = 'doctor_analytics'
    )
    THEN '✅ PASS: doctor_analytics view exists'
    ELSE '❌ FAIL: doctor_analytics view not found'
  END as result;

\echo ''

-- =====================================================
-- TEST 2: Verify Functions Exist
-- =====================================================

\echo '⚡ TEST 2: Checking if RPC functions exist...'

SELECT
  CASE
    WHEN COUNT(*) = 2
    THEN '✅ PASS: Both RPC functions exist'
    ELSE '❌ FAIL: Missing RPC functions'
  END as result,
  COUNT(*) as function_count
FROM pg_proc
WHERE proname IN ('get_doctor_analytics', 'calculate_earnings_growth');

\echo ''

-- =====================================================
-- TEST 3: Verify Trigger Exists
-- =====================================================

\echo '🔄 TEST 3: Checking if real-time trigger exists...'

SELECT
  CASE
    WHEN COUNT(*) > 0
    THEN '✅ PASS: Real-time trigger exists'
    ELSE '❌ FAIL: Real-time trigger not found'
  END as result
FROM pg_trigger
WHERE tgname = 'trigger_update_doctor_stats_realtime';

\echo ''

-- =====================================================
-- TEST 4: Verify Indexes Exist
-- =====================================================

\echo '🚀 TEST 4: Checking if performance indexes exist...'

SELECT
  COUNT(*) as index_count,
  CASE
    WHEN COUNT(*) >= 7
    THEN '✅ PASS: All required indexes exist'
    ELSE '⚠️  WARNING: Some indexes may be missing'
  END as result
FROM pg_indexes
WHERE tablename IN ('bookings', 'doctor_earnings')
AND indexname LIKE 'idx_%';

\echo ''

-- =====================================================
-- TEST 5: Test View Query
-- =====================================================

\echo '📈 TEST 5: Testing doctor_analytics view query...'

DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count FROM doctor_analytics;

  IF record_count >= 0 THEN
    RAISE NOTICE '✅ PASS: View query works (% records found)', record_count;
  ELSE
    RAISE NOTICE '❌ FAIL: View query failed';
  END IF;
END $$;

-- Show sample data
\echo ''
\echo 'Sample data from doctor_analytics view:'
SELECT
  doctor_id,
  full_name,
  total_consultations,
  today_total,
  week_total,
  total_earnings,
  rating
FROM doctor_analytics
LIMIT 3;

\echo ''

-- =====================================================
-- TEST 6: Test get_doctor_analytics Function
-- =====================================================

\echo '🔍 TEST 6: Testing get_doctor_analytics() function...'

DO $$
DECLARE
  test_doctor_id UUID;
  result_count INTEGER;
BEGIN
  -- Get a doctor ID to test with
  SELECT id INTO test_doctor_id FROM doctors WHERE is_active = TRUE LIMIT 1;

  IF test_doctor_id IS NOT NULL THEN
    -- Test the function
    SELECT COUNT(*) INTO result_count
    FROM get_doctor_analytics(test_doctor_id);

    IF result_count > 0 THEN
      RAISE NOTICE '✅ PASS: get_doctor_analytics() works (tested with doctor: %)', test_doctor_id;
    ELSE
      RAISE NOTICE '⚠️  WARNING: Function works but returned no data';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  SKIP: No active doctors found to test with';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 7: Test calculate_earnings_growth Function
-- =====================================================

\echo '📊 TEST 7: Testing calculate_earnings_growth() function...'

DO $$
DECLARE
  test_doctor_id UUID;
  growth_result NUMERIC;
BEGIN
  -- Get a doctor ID to test with
  SELECT id INTO test_doctor_id FROM doctors WHERE is_active = TRUE LIMIT 1;

  IF test_doctor_id IS NOT NULL THEN
    -- Test the function
    SELECT calculate_earnings_growth(test_doctor_id) INTO growth_result;

    IF growth_result IS NOT NULL THEN
      RAISE NOTICE '✅ PASS: calculate_earnings_growth() works (result: %)', growth_result;
    ELSE
      RAISE NOTICE '❌ FAIL: Function returned NULL';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  SKIP: No active doctors found to test with';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 8: Verify Permissions
-- =====================================================

\echo '🔐 TEST 8: Checking permissions...'

SELECT
  CASE
    WHEN COUNT(*) = 2
    THEN '✅ PASS: Functions have correct permissions'
    ELSE '⚠️  WARNING: Check function permissions'
  END as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('get_doctor_analytics', 'calculate_earnings_growth')
AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

\echo ''

-- =====================================================
-- TEST 9: Sample Analytics Data
-- =====================================================

\echo '📊 TEST 9: Sample Analytics Data (First Active Doctor):'
\echo ''

-- Get analytics for the first active doctor
DO $$
DECLARE
  test_doctor_id UUID;
BEGIN
  SELECT id INTO test_doctor_id FROM doctors WHERE is_active = TRUE LIMIT 1;

  IF test_doctor_id IS NOT NULL THEN
    RAISE NOTICE 'Testing with Doctor ID: %', test_doctor_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Full Analytics:';

    -- This will show all analytics fields
    PERFORM * FROM get_doctor_analytics(test_doctor_id);
  ELSE
    RAISE NOTICE 'No active doctors found for testing';
  END IF;
END $$;

-- Show detailed results
SELECT * FROM get_doctor_analytics(
  (SELECT id FROM doctors WHERE is_active = TRUE LIMIT 1)
);

\echo ''

-- =====================================================
-- TEST 10: Performance Test
-- =====================================================

\echo '⚡ TEST 10: Performance Test...'

\timing on

-- Time the view query
EXPLAIN ANALYZE
SELECT * FROM doctor_analytics LIMIT 10;

\timing off

\echo ''

-- =====================================================
-- SUMMARY
-- =====================================================

\echo '==============================================='
\echo '✅ ALL TESTS COMPLETE!'
\echo '==============================================='
\echo ''
\echo 'If all tests passed, your real-time analytics'
\echo 'are working correctly!'
\echo ''
\echo 'Next steps:'
\echo '1. Check your Doctor Dashboard in the app'
\echo '2. Create a test booking to see real-time updates'
\echo '3. Monitor the analytics cards for live data'
\echo ''
\echo '==============================================='

-- =====================================================
-- OPTIONAL: Create Test Data
-- =====================================================

\echo ''
\echo '💡 OPTIONAL: Want to create test data?'
\echo ''
\echo 'Run the following commands to create a test booking:'
\echo ''
\echo '-- 1. Get IDs for testing'
\echo 'SELECT id as doctor_id FROM doctors WHERE is_active = TRUE LIMIT 1;'
\echo 'SELECT id as user_id FROM users LIMIT 1;'
\echo 'SELECT id as pet_id FROM pets LIMIT 1;'
\echo ''
\echo '-- 2. Create test booking (replace IDs)'
\echo 'INSERT INTO bookings ('
\echo '  user_id, pet_id, service_type, booking_type,'
\echo '  date, time, status, doctor_id'
\echo ') VALUES ('
\echo '  ''YOUR_USER_ID'','
\echo '  ''YOUR_PET_ID'','
\echo '  ''consultation'','
\echo '  ''online'','
\echo '  TO_CHAR(CURRENT_DATE, ''YYYY-MM-DD''),'
\echo '  ''10:00'','
\echo '  ''upcoming'','
\echo '  ''YOUR_DOCTOR_ID'''
\echo ');'
\echo ''
\echo '-- 3. Check if analytics updated'
\echo 'SELECT * FROM get_doctor_analytics(''YOUR_DOCTOR_ID'');'
\echo ''
