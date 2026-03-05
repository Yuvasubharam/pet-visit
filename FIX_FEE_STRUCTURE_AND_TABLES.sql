-- =====================================================
-- Fee Structure & Table Linking Fix
-- =====================================================
-- Purpose: Properly structure fees and link all tables
-- Service Fee: User pays to doctor
-- Platform Fee (Tax & Handling): App's margin
-- Doctor Commission: 0-5% variable commission from doctor
-- =====================================================

-- =====================================================
-- PART 1: Add Platform Settings Table
-- =====================================================

-- Table to store platform-wide settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES
  ('platform_fee_percentage', '{"value": 0.05}'::jsonb, 'Platform fee percentage (5% of service fee)'),
  ('default_doctor_commission', '{"value": 0.15}'::jsonb, 'Default doctor commission (15% of their earnings)')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- PART 2: Update Doctors Table with Commission
-- =====================================================

-- Add commission_percentage to doctors table (0-5%)
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 0.00;

-- Add comment
COMMENT ON COLUMN doctors.commission_percentage IS 'Variable commission percentage (0-5%) charged from doctor earnings';

-- Set default commission for existing doctors (2.5%)
UPDATE doctors
SET commission_percentage = 2.50
WHERE commission_percentage IS NULL OR commission_percentage = 0;

-- =====================================================
-- PART 3: Add Platform Earnings Table
-- =====================================================

-- Table to track platform earnings
CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

  -- Fee breakdown
  service_fee DECIMAL(10, 2) NOT NULL, -- What user paid
  platform_fee DECIMAL(10, 2) NOT NULL, -- Platform's margin (Tax & Handling)
  doctor_commission DECIMAL(10, 2) NOT NULL, -- Commission from doctor
  total_platform_income DECIMAL(10, 2) NOT NULL, -- platform_fee + doctor_commission

  -- Doctor earnings breakdown
  doctor_gross_amount DECIMAL(10, 2) NOT NULL, -- service_fee
  doctor_commission_deducted DECIMAL(10, 2) NOT NULL, -- commission from doctor
  doctor_net_amount DECIMAL(10, 2) NOT NULL, -- what doctor receives after commission

  -- Metadata
  commission_percentage DECIMAL(5, 2) NOT NULL, -- Percentage used for this booking
  platform_fee_percentage DECIMAL(5, 2) NOT NULL, -- Percentage used for this booking

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_platform_earning_per_booking UNIQUE (booking_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_platform_earnings_booking_id ON platform_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_created_at ON platform_earnings(created_at);

-- =====================================================
-- PART 4: Update Doctor Earnings Table
-- =====================================================

-- Ensure doctor_earnings has proper foreign keys
ALTER TABLE doctor_earnings
DROP CONSTRAINT IF EXISTS fk_doctor_earnings_doctor;

ALTER TABLE doctor_earnings
ADD CONSTRAINT fk_doctor_earnings_doctor
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

ALTER TABLE doctor_earnings
DROP CONSTRAINT IF EXISTS fk_doctor_earnings_booking;

ALTER TABLE doctor_earnings
ADD CONSTRAINT fk_doctor_earnings_booking
FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- Add platform_commission column to track commission deducted
ALTER TABLE doctor_earnings
ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment
COMMENT ON COLUMN doctor_earnings.platform_commission IS 'Platform commission deducted from doctor gross earnings (0-5%)';

-- =====================================================
-- PART 5: Update Bookings Table
-- =====================================================

-- Add fee breakdown columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10, 2);

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2);

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Add comments
COMMENT ON COLUMN bookings.service_fee IS 'Fee paid to doctor (consultation/grooming fee)';
COMMENT ON COLUMN bookings.platform_fee IS 'Platform margin (Tax & Handling - 5% of service fee)';
COMMENT ON COLUMN bookings.total_amount IS 'Total amount user pays (service_fee + platform_fee)';

-- Migrate existing data
UPDATE bookings
SET
  service_fee = payment_amount,
  platform_fee = payment_amount * 0.05,
  total_amount = payment_amount * 1.05
WHERE service_fee IS NULL AND payment_amount IS NOT NULL;

-- =====================================================
-- PART 6: Create Function to Calculate Fees
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_booking_fees(
  p_service_fee DECIMAL(10, 2),
  p_doctor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  service_fee DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  doctor_gross DECIMAL(10, 2),
  doctor_commission DECIMAL(10, 2),
  doctor_net DECIMAL(10, 2),
  platform_total DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2),
  platform_fee_percentage DECIMAL(5, 2)
) AS $$
DECLARE
  v_platform_fee_pct DECIMAL(5, 2);
  v_commission_pct DECIMAL(5, 2);
BEGIN
  -- Get platform fee percentage (default 5%)
  SELECT (setting_value->>'value')::DECIMAL
  INTO v_platform_fee_pct
  FROM platform_settings
  WHERE setting_key = 'platform_fee_percentage';

  IF v_platform_fee_pct IS NULL THEN
    v_platform_fee_pct := 0.05;
  END IF;

  -- Get doctor commission percentage
  IF p_doctor_id IS NOT NULL THEN
    SELECT d.commission_percentage
    INTO v_commission_pct
    FROM doctors d
    WHERE d.id = p_doctor_id;
  END IF;

  IF v_commission_pct IS NULL THEN
    SELECT (setting_value->>'value')::DECIMAL
    INTO v_commission_pct
    FROM platform_settings
    WHERE setting_key = 'default_doctor_commission';

    IF v_commission_pct IS NULL THEN
      v_commission_pct := 0.15;
    END IF;
  END IF;

  -- Calculate fees
  RETURN QUERY SELECT
    p_service_fee, -- service_fee
    ROUND(p_service_fee * v_platform_fee_pct, 2), -- platform_fee
    ROUND(p_service_fee * (1 + v_platform_fee_pct), 2), -- total_amount
    p_service_fee, -- doctor_gross
    ROUND(p_service_fee * v_commission_pct, 2), -- doctor_commission
    ROUND(p_service_fee * (1 - v_commission_pct), 2), -- doctor_net
    ROUND(p_service_fee * v_platform_fee_pct, 2) + ROUND(p_service_fee * v_commission_pct, 2), -- platform_total
    v_commission_pct * 100, -- commission_percentage
    v_platform_fee_pct * 100; -- platform_fee_percentage
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: Create Trigger to Auto-Calculate Fees
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_calculate_booking_fees()
RETURNS TRIGGER AS $$
DECLARE
  v_fees RECORD;
BEGIN
  -- Only calculate if payment_amount is set and fees are not set
  IF NEW.payment_amount IS NOT NULL AND NEW.service_fee IS NULL THEN
    SELECT * INTO v_fees
    FROM calculate_booking_fees(NEW.payment_amount, NEW.doctor_id);

    NEW.service_fee := v_fees.service_fee;
    NEW.platform_fee := v_fees.platform_fee;
    NEW.total_amount := v_fees.total_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_calculate_booking_fees ON bookings;

CREATE TRIGGER trigger_calculate_booking_fees
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_booking_fees();

-- =====================================================
-- PART 8: Update Earnings Creation Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION create_earnings_on_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_fees RECORD;
BEGIN
  -- Only create earnings when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed'
     AND NEW.doctor_id IS NOT NULL
     AND NEW.payment_amount IS NOT NULL THEN

    -- Calculate all fees
    SELECT * INTO v_fees
    FROM calculate_booking_fees(NEW.payment_amount, NEW.doctor_id);

    -- Create doctor earnings record
    INSERT INTO doctor_earnings (
      doctor_id,
      booking_id,
      gross_amount,
      platform_fee, -- This was platform_commission before
      net_amount,
      platform_commission,
      status
    ) VALUES (
      NEW.doctor_id,
      NEW.id,
      v_fees.doctor_gross,
      v_fees.doctor_commission, -- Old platform_fee column now stores doctor commission
      v_fees.doctor_net,
      v_fees.doctor_commission, -- New column explicitly for platform commission
      'pending'
    )
    ON CONFLICT (booking_id) DO NOTHING;

    -- Create platform earnings record
    INSERT INTO platform_earnings (
      booking_id,
      service_fee,
      platform_fee,
      doctor_commission,
      total_platform_income,
      doctor_gross_amount,
      doctor_commission_deducted,
      doctor_net_amount,
      commission_percentage,
      platform_fee_percentage
    ) VALUES (
      NEW.id,
      v_fees.service_fee,
      v_fees.platform_fee,
      v_fees.doctor_commission,
      v_fees.platform_total,
      v_fees.doctor_gross,
      v_fees.doctor_commission,
      v_fees.doctor_net,
      v_fees.commission_percentage,
      v_fees.platform_fee_percentage
    )
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_create_earnings_on_complete ON bookings;

CREATE TRIGGER trigger_create_earnings_on_complete
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_earnings_on_complete();

-- =====================================================
-- PART 9: Update Doctor Analytics View
-- =====================================================

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

  -- Consultation counts
  COUNT(DISTINCT b.id) FILTER (
    WHERE b.doctor_id = d.id AND b.service_type = 'consultation'
  ) as total_consultations,

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

  -- Earnings with new structure
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

-- Grant permissions
GRANT SELECT ON doctor_analytics TO authenticated;

-- =====================================================
-- PART 10: Create Platform Revenue Summary View
-- =====================================================

CREATE OR REPLACE VIEW platform_revenue_summary AS
SELECT
  -- Total platform income
  COALESCE(SUM(platform_fee), 0) as total_platform_fees,
  COALESCE(SUM(doctor_commission), 0) as total_doctor_commissions,
  COALESCE(SUM(total_platform_income), 0) as total_platform_income,

  -- Total processed
  COALESCE(SUM(service_fee), 0) as total_service_fees,
  COALESCE(SUM(service_fee + platform_fee), 0) as total_revenue,

  -- Today's stats
  COALESCE(SUM(total_platform_income) FILTER (
    WHERE DATE(created_at) = CURRENT_DATE
  ), 0) as today_platform_income,

  -- This month
  COALESCE(SUM(total_platform_income) FILTER (
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
  ), 0) as month_platform_income,

  -- Count
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_bookings

FROM platform_earnings;

GRANT SELECT ON platform_revenue_summary TO authenticated;

-- =====================================================
-- PART 11: Add RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE platform_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Platform earnings - only viewable by admins
DROP POLICY IF EXISTS "Platform earnings viewable by authenticated" ON platform_earnings;
DROP POLICY IF EXISTS "Platform earnings viewable by admins" ON platform_earnings;
CREATE POLICY "Platform earnings viewable by admins"
ON platform_earnings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
  )
);

-- Platform settings - everyone can read
DROP POLICY IF EXISTS "Platform settings readable by all" ON platform_settings;
CREATE POLICY "Platform settings readable by all"
ON platform_settings FOR SELECT
TO authenticated
USING (true);

-- Platform settings - only service role can modify
-- Note: Modify this policy based on your admin access requirements
-- For now, allowing authenticated users to read, restrict writes to service role

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check fee calculation
SELECT * FROM calculate_booking_fees(500.00, NULL);

-- View platform settings
SELECT * FROM platform_settings;

-- View doctor commissions
SELECT id, full_name, commission_percentage FROM doctors LIMIT 5;

COMMENT ON TABLE platform_earnings IS 'Tracks all platform income from bookings (platform fees + doctor commissions)';
COMMENT ON TABLE platform_settings IS 'Stores platform-wide configuration settings';
COMMENT ON FUNCTION calculate_booking_fees IS 'Calculates all fees for a booking: service fee, platform fee, doctor commission, and net amounts';
