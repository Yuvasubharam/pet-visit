-- =====================================================
-- UPDATE DOCTOR ANALYTICS TO FETCH RATING FROM REVIEWS
-- =====================================================
-- This migration updates the doctor_analytics view and
-- get_doctor_analytics function to calculate average
-- rating from the doctor_reviews table instead of the
-- doctors table.
-- =====================================================

-- =====================================================
-- PART 1: Update Doctor Analytics View
-- =====================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS doctor_analytics CASCADE;

-- Create updated view with rating from doctor_reviews
CREATE OR REPLACE VIEW doctor_analytics AS
SELECT
  d.id as doctor_id,
  d.full_name,
  d.email,
  d.phone,
  d.specialization,
  d.profile_photo_url,
  d.rating as doctor_rating, -- Keep original rating for reference
  d.commission_percentage,

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

  -- Earnings breakdown
  COALESCE(SUM(de.gross_amount), 0) as gross_earnings,
  COALESCE(SUM(de.platform_commission), 0) as total_commission_paid,
  COALESCE(SUM(de.net_amount), 0) as total_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.status = 'paid'), 0) as paid_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.status = 'pending'), 0) as pending_earnings,

  -- Average rating from doctor_reviews table
  COALESCE(
    (
      SELECT ROUND(AVG(dr.rating)::numeric, 2)
      FROM doctor_reviews dr
      WHERE dr.doctor_id = d.id
    ),
    0
  ) as average_rating,

  -- Total number of reviews
  COALESCE(
    (
      SELECT COUNT(*)
      FROM doctor_reviews dr
      WHERE dr.doctor_id = d.id
    ),
    0
  ) as total_reviews

FROM doctors d
LEFT JOIN bookings b ON b.doctor_id = d.id
LEFT JOIN doctor_earnings de ON de.doctor_id = d.id
WHERE d.is_active = TRUE
GROUP BY d.id, d.full_name, d.email, d.phone, d.specialization, d.profile_photo_url, d.rating, d.commission_percentage;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON doctor_analytics TO authenticated;

-- =====================================================
-- PART 2: Update get_doctor_analytics Function
-- =====================================================

-- Drop the existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_doctor_analytics(UUID);

-- Create updated function to get analytics for a specific doctor
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
  rating NUMERIC,
  total_reviews BIGINT
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
    da.average_rating as rating,  -- Return average_rating from reviews
    da.total_reviews
  FROM doctor_analytics da
  WHERE da.doctor_id = p_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Grant EXECUTE on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_doctor_analytics(UUID) TO authenticated;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Successfully updated doctor_analytics view to use ratings from doctor_reviews!';
  RAISE NOTICE '✓ Updated get_doctor_analytics() function to return average rating!';
  RAISE NOTICE '✓ Doctor dashboard will now display average rating from patient reviews!';
END
$$;
