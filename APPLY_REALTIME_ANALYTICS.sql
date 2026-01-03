-- =====================================================
-- QUICK APPLY: Real-Time Analytics Migration
-- =====================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" to apply the migration
-- =====================================================

-- This is the same as supabase/migrations/011_realtime_analytics.sql
-- But formatted for easy copy-paste into Supabase Dashboard

\echo '🚀 Starting Real-Time Analytics Migration...'

-- =====================================================
-- PART 1: Create Doctor Analytics View
-- =====================================================

\echo '📊 Creating doctor_analytics view...'

DROP VIEW IF EXISTS doctor_analytics CASCADE;

CREATE OR REPLACE VIEW doctor_analytics AS
SELECT
  d.id as doctor_id,
  d.full_name,
  d.email,
  d.phone,
  d.specialization,
  d.profile_photo_url,
  d.rating,
  d.commission_percentage,

  COUNT(DISTINCT b.id) FILTER (WHERE b.doctor_id = d.id AND b.service_type = 'consultation') as total_consultations,

  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id
    AND b.service_type = 'consultation'
    AND b.date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
  ) as today_total,

  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id
    AND b.service_type = 'consultation'
    AND b.date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
    AND b.status = 'completed'
  ) as today_completed,

  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id
    AND b.service_type = 'consultation'
    AND b.date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
    AND b.status = 'upcoming'
  ) as today_upcoming,

  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id
    AND b.service_type = 'consultation'
    AND b.date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
    AND b.status = 'cancelled'
  ) as today_cancelled,

  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id
    AND b.service_type = 'consultation'
    AND TO_DATE(b.date, 'YYYY-MM-DD') >= DATE_TRUNC('week', CURRENT_DATE)
    AND TO_DATE(b.date, 'YYYY-MM-DD') < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
  ) as week_total,

  COALESCE(SUM(de.gross_amount), 0) as gross_earnings,
  COALESCE(SUM(de.platform_commission), 0) as total_commission_paid,
  COALESCE(SUM(de.net_amount), 0) as total_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.status = 'paid'), 0) as paid_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.status = 'pending'), 0) as pending_earnings

FROM doctors d
LEFT JOIN bookings b ON b.doctor_id = d.id
LEFT JOIN doctor_earnings de ON de.doctor_id = d.id
WHERE d.is_active = TRUE
GROUP BY d.id, d.full_name, d.email, d.phone, d.specialization, d.profile_photo_url, d.rating, d.commission_percentage;

GRANT SELECT ON doctor_analytics TO authenticated;

\echo '✅ View created successfully!'

-- =====================================================
-- PART 2: Create RPC Functions
-- =====================================================

\echo '⚡ Creating get_doctor_analytics function...'

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

GRANT EXECUTE ON FUNCTION get_doctor_analytics(UUID) TO authenticated;

\echo '✅ get_doctor_analytics function created!'

\echo '📈 Creating calculate_earnings_growth function...'

CREATE OR REPLACE FUNCTION calculate_earnings_growth(p_doctor_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  current_month_earnings NUMERIC;
  last_month_earnings NUMERIC;
  growth_percentage NUMERIC;
BEGIN
  SELECT COALESCE(SUM(net_amount), 0) INTO current_month_earnings
  FROM doctor_earnings
  WHERE doctor_id = p_doctor_id
  AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  SELECT COALESCE(SUM(net_amount), 0) INTO last_month_earnings
  FROM doctor_earnings
  WHERE doctor_id = p_doctor_id
  AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month');

  IF last_month_earnings = 0 THEN
    IF current_month_earnings > 0 THEN
      RETURN 100.0;
    ELSE
      RETURN 0.0;
    END IF;
  ELSE
    growth_percentage := ((current_month_earnings - last_month_earnings) / last_month_earnings) * 100;
    RETURN ROUND(growth_percentage, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION calculate_earnings_growth(UUID) TO authenticated;

\echo '✅ calculate_earnings_growth function created!'

-- =====================================================
-- PART 3: Create Real-Time Update Trigger
-- =====================================================

\echo '🔄 Creating real-time update trigger...'

CREATE OR REPLACE FUNCTION update_doctor_stats_realtime()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE doctors
    SET
      total_consultations = (
        SELECT COUNT(*)
        FROM bookings
        WHERE doctor_id = NEW.doctor_id
        AND service_type = 'consultation'
        AND status IN ('completed', 'upcoming')
      ),
      updated_at = NOW()
    WHERE id = NEW.doctor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_doctor_stats_realtime ON bookings;

CREATE TRIGGER trigger_update_doctor_stats_realtime
AFTER INSERT OR UPDATE OF status, doctor_id ON bookings
FOR EACH ROW
WHEN (NEW.doctor_id IS NOT NULL AND NEW.service_type = 'consultation')
EXECUTE FUNCTION update_doctor_stats_realtime();

\echo '✅ Trigger created successfully!'

-- =====================================================
-- PART 4: Create Performance Indexes
-- =====================================================

\echo '🚀 Creating performance indexes...'

CREATE INDEX IF NOT EXISTS idx_bookings_doctor_date ON bookings(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_doctor_earnings_doctor_id ON doctor_earnings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_earnings_booking_id ON doctor_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor_null ON bookings(doctor_id) WHERE doctor_id IS NULL;

\echo '✅ Indexes created successfully!'

-- =====================================================
-- PART 5: Verify Installation
-- =====================================================

\echo '🔍 Verifying installation...'

DO $$
DECLARE
  view_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Check view
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_name = 'doctor_analytics';

  -- Check functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN ('get_doctor_analytics', 'calculate_earnings_growth');

  -- Check trigger
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'trigger_update_doctor_stats_realtime';

  RAISE NOTICE '=====================================';
  RAISE NOTICE '✅ INSTALLATION COMPLETE!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Views created: %', view_count;
  RAISE NOTICE 'Functions created: %', function_count;
  RAISE NOTICE 'Triggers created: %', trigger_count;
  RAISE NOTICE '=====================================';
  RAISE NOTICE '📊 Real-time analytics are now active!';
  RAISE NOTICE '🎯 Your doctor dashboard will show live data';
  RAISE NOTICE '⚡ Stats update automatically on changes';
  RAISE NOTICE '=====================================';
END
$$;

-- =====================================================
-- Test Query (Optional)
-- =====================================================

\echo '🧪 Sample test query:'
\echo 'SELECT * FROM doctor_analytics LIMIT 5;'
\echo ''
\echo '💡 To test analytics for a specific doctor:'
\echo "SELECT * FROM get_doctor_analytics('YOUR_DOCTOR_ID');"
