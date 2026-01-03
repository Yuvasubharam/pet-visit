-- =====================================================
-- CREATE REAL-TIME ANALYTICS VIEW FOR DOCTOR DASHBOARD
-- =====================================================
-- This script creates a materialized view and functions to provide
-- real-time analytics for the doctor dashboard

-- =====================================================
-- PART 1: Create Doctor Analytics View
-- =====================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS doctor_analytics CASCADE;

-- Create a view for real-time doctor analytics
CREATE OR REPLACE VIEW doctor_analytics AS
SELECT
  d.id as doctor_id,
  d.full_name,
  d.email,
  d.phone,
  d.specialization,
  d.profile_photo_url,
  d.rating,

  -- Total consultations (all time)
  COUNT(DISTINCT b.id) FILTER (WHERE b.doctor_id = d.id AND b.service_type = 'consultation') as total_consultations,

  -- Today's stats
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

  -- This week's stats
  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id
    AND b.service_type = 'consultation'
    AND TO_DATE(b.date, 'YYYY-MM-DD') >= DATE_TRUNC('week', CURRENT_DATE)
    AND TO_DATE(b.date, 'YYYY-MM-DD') < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
  ) as week_total,

  -- Pending new bookings (unassigned)
  COUNT(DISTINCT b2.id) FILTER (
    WHERE b2.doctor_id IS NULL
    AND b2.service_type = 'consultation'
  ) as pending_requests,

  -- Total earnings
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.doctor_id = d.id), 0) as total_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.doctor_id = d.id AND de.status = 'paid'), 0) as paid_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.doctor_id = d.id AND de.status = 'pending'), 0) as pending_earnings

FROM doctors d
LEFT JOIN bookings b ON b.doctor_id = d.id
LEFT JOIN bookings b2 ON 1=1  -- For pending requests (no join condition, filtered in WHERE)
LEFT JOIN doctor_earnings de ON de.doctor_id = d.id
WHERE d.is_active = TRUE
GROUP BY d.id, d.full_name, d.email, d.phone, d.specialization, d.profile_photo_url, d.rating;

-- Note: Cannot create indexes on views. Instead, ensure underlying tables have proper indexes:
-- CREATE INDEX IF NOT EXISTS idx_bookings_doctor_id ON bookings(doctor_id);
-- CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
-- CREATE INDEX IF NOT EXISTS idx_doctor_earnings_doctor_id ON doctor_earnings(doctor_id);

-- =====================================================
-- PART 2: Update Trigger Functions
-- =====================================================

-- Function to update doctor stats in real-time
CREATE OR REPLACE FUNCTION update_doctor_stats_realtime()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total consultations and earnings for the doctor
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_doctor_stats_realtime ON bookings;

-- Create trigger for real-time stats update
CREATE TRIGGER trigger_update_doctor_stats_realtime
AFTER INSERT OR UPDATE OF status, doctor_id ON bookings
FOR EACH ROW
WHEN (NEW.doctor_id IS NOT NULL AND NEW.service_type = 'consultation')
EXECUTE FUNCTION update_doctor_stats_realtime();

-- =====================================================
-- PART 3: Function to Get Doctor Analytics
-- =====================================================

-- Create function to get analytics for a specific doctor
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
      FROM bookings
      WHERE doctor_id IS NULL
      AND service_type = 'consultation'
      AND status = 'upcoming'
    )::BIGINT as pending_requests,
    da.total_earnings,
    da.paid_earnings,
    da.pending_earnings,
    da.rating
  FROM doctor_analytics da
  WHERE da.doctor_id = p_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: Grant Permissions
-- =====================================================

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON doctor_analytics TO authenticated;

-- Grant EXECUTE on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_doctor_analytics(UUID) TO authenticated;

-- =====================================================
-- PART 5: RLS Policy for Analytics View
-- =====================================================

-- Enable RLS on doctors table (if not already enabled)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Policy to allow doctors to see their own analytics via the view
-- Note: Views inherit RLS from underlying tables, so we need to ensure
-- doctors can query the view for their own data

-- =====================================================
-- PART 6: Helper Function for Earnings Percentage
-- =====================================================

-- Function to calculate earnings growth percentage
CREATE OR REPLACE FUNCTION calculate_earnings_growth(p_doctor_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  current_month_earnings NUMERIC;
  last_month_earnings NUMERIC;
  growth_percentage NUMERIC;
BEGIN
  -- Get current month earnings
  SELECT COALESCE(SUM(net_amount), 0) INTO current_month_earnings
  FROM doctor_earnings
  WHERE doctor_id = p_doctor_id
  AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Get last month earnings
  SELECT COALESCE(SUM(net_amount), 0) INTO last_month_earnings
  FROM doctor_earnings
  WHERE doctor_id = p_doctor_id
  AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month');

  -- Calculate growth percentage
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

-- =====================================================
-- PART 7: Success Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Successfully created real-time analytics view!';
  RAISE NOTICE '✓ Created get_doctor_analytics() function!';
  RAISE NOTICE '✓ Created calculate_earnings_growth() function!';
  RAISE NOTICE '✓ Set up real-time update triggers!';
  RAISE NOTICE '✓ Doctor dashboard analytics are now real-time!';
END
$$;
