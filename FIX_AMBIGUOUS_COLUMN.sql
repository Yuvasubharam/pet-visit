-- =====================================================
-- QUICK FIX: Ambiguous Column Reference
-- =====================================================
-- If you already applied the migration and got an error
-- about "column reference doctor_id is ambiguous",
-- run this fix to correct the get_doctor_analytics function
-- =====================================================

\echo '🔧 Fixing ambiguous column reference in get_doctor_analytics...'

-- Drop the problematic function
DROP FUNCTION IF EXISTS get_doctor_analytics(UUID);

-- Recreate with proper table aliases
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
      FROM bookings b
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_doctor_analytics(UUID) TO authenticated;

\echo '✅ Function fixed successfully!'
\echo ''
\echo '🧪 Testing the fix...'

-- Test the function
DO $$
DECLARE
  test_doctor_id UUID;
  result_count INTEGER;
BEGIN
  SELECT id INTO test_doctor_id FROM doctors WHERE is_active = TRUE LIMIT 1;

  IF test_doctor_id IS NOT NULL THEN
    SELECT COUNT(*) INTO result_count FROM get_doctor_analytics(test_doctor_id);

    IF result_count > 0 THEN
      RAISE NOTICE '✅ SUCCESS: Function works correctly!';
      RAISE NOTICE 'Tested with doctor ID: %', test_doctor_id;
    ELSE
      RAISE NOTICE '⚠️  Function works but returned no data (doctor may have no analytics yet)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No active doctors found to test with';
  END IF;
END $$;

\echo ''
\echo '==============================================='
\echo '✅ FIX COMPLETE!'
\echo '==============================================='
\echo ''
\echo 'The get_doctor_analytics function has been fixed.'
\echo 'You can now use it without the ambiguous column error.'
\echo ''
\echo 'Test it yourself:'
\echo "SELECT * FROM get_doctor_analytics('your-doctor-id');"
\echo ''
