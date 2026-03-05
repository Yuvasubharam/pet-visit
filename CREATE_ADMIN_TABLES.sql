-- =====================================================
-- ADMIN MANAGEMENT DATABASE SCHEMA
-- =====================================================

-- 1. Create admin_users table for admin role management
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  is_active BOOLEAN DEFAULT true,
  profile_photo TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '[]'::jsonb
);

-- 2. Create admin_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'doctor', 'grooming_store', 'booking', 'order', 'admin')),
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Extend users table with admin-relevant fields (if not exists)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES admin_users(id);

-- 4. Extend doctors table with admin approval workflow
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS credentials_url TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Create platform_analytics table for dashboard stats
-- First, drop if it exists as a view (from previous runs)
DROP VIEW IF EXISTS platform_analytics CASCADE;

CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_doctors INTEGER DEFAULT 0,
  active_doctors INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  platform_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create user_reports table for flagged users
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reporter_id UUID,
  reporter_type TEXT CHECK (reporter_type IN ('user', 'doctor', 'admin')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES admin_users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 7. Create doctor_verification_requests table
CREATE TABLE IF NOT EXISTS doctor_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  credentials_url TEXT NOT NULL,
  license_number TEXT,
  experience_years INTEGER,
  education JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admin_users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doctors_approval ON doctors(approval);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);

-- Index for platform_analytics table (not view)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_analytics') THEN
        CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(date DESC);
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON user_reports(reported_user_id);

CREATE INDEX IF NOT EXISTS idx_doctor_verification_status ON doctor_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_doctor_verification_doctor ON doctor_verification_requests(doctor_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all admin tables (only tables, not views)
DO $$
BEGIN
    -- Enable RLS only if these are tables, not views
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_users') THEN
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_activity_logs') THEN
        ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_reports') THEN
        ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'doctor_verification_requests') THEN
        ALTER TABLE doctor_verification_requests ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_analytics') THEN
        ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- Admin users can read all admin data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_users'
        AND policyname = 'Admin users can read admin_users'
    ) THEN
        CREATE POLICY "Admin users can read admin_users" ON admin_users
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid() AND au.is_active = true
            )
          );
    END IF;
END$$;

-- Super admins can manage admin users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_users'
        AND policyname = 'Super admins can manage admin_users'
    ) THEN
        CREATE POLICY "Super admins can manage admin_users" ON admin_users
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
            )
          );
    END IF;
END$$;

-- Admin users can create activity logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_activity_logs'
        AND policyname = 'Admins can create activity logs'
    ) THEN
        CREATE POLICY "Admins can create activity logs" ON admin_activity_logs
          FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.id = admin_id AND au.is_active = true
            )
          );
    END IF;
END$$;

-- Admin users can read activity logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_activity_logs'
        AND policyname = 'Admins can read activity logs'
    ) THEN
        CREATE POLICY "Admins can read activity logs" ON admin_activity_logs
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid() AND au.is_active = true
            )
          );
    END IF;
END$$;

-- Users can report other users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_reports'
        AND policyname = 'Users can create reports'
    ) THEN
        CREATE POLICY "Users can create reports" ON user_reports
          FOR INSERT
          WITH CHECK (true);
    END IF;
END$$;

-- Admins can read and manage reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_reports'
        AND policyname = 'Admins can manage reports'
    ) THEN
        CREATE POLICY "Admins can manage reports" ON user_reports
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid() AND au.is_active = true
            )
          );
    END IF;
END$$;

-- Doctors can create verification requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'doctor_verification_requests'
        AND policyname = 'Doctors can create verification requests'
    ) THEN
        CREATE POLICY "Doctors can create verification requests" ON doctor_verification_requests
          FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM doctors d
              WHERE d.id = doctor_id AND d.user_id = auth.uid()
            )
          );
    END IF;
END$$;

-- Admins can manage verification requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'doctor_verification_requests'
        AND policyname = 'Admins can manage verification requests'
    ) THEN
        CREATE POLICY "Admins can manage verification requests" ON doctor_verification_requests
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid() AND au.is_active = true
            )
          );
    END IF;
END$$;

-- Admins can read platform analytics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'platform_analytics'
        AND policyname = 'Admins can read platform analytics'
    ) THEN
        CREATE POLICY "Admins can read platform analytics" ON platform_analytics
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid() AND au.is_active = true
            )
          );
    END IF;
END$$;

-- =====================================================
-- FUNCTIONS FOR AUTOMATED ANALYTICS
-- =====================================================

-- Function to update platform analytics daily
CREATE OR REPLACE FUNCTION update_platform_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO platform_analytics (
    date,
    total_users,
    new_users,
    active_users,
    total_doctors,
    active_doctors,
    total_bookings,
    completed_bookings,
    cancelled_bookings,
    total_revenue,
    platform_revenue
  )
  SELECT
    CURRENT_DATE,
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(DISTINCT user_id) FROM bookings WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'),
    (SELECT COUNT(*) FROM doctors),
    (SELECT COUNT(*) FROM doctors WHERE is_active = true),
    (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND DATE(updated_at) = CURRENT_DATE),
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COALESCE(SUM(platform_fee), 0) FROM bookings WHERE DATE(created_at) = CURRENT_DATE)
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    total_doctors = EXCLUDED.total_doctors,
    active_doctors = EXCLUDED.active_doctors,
    total_bookings = EXCLUDED.total_bookings,
    completed_bookings = EXCLUDED.completed_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    total_revenue = EXCLUDED.total_revenue,
    platform_revenue = EXCLUDED.platform_revenue,
    updated_at = now();
END;
$$;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be called from application code
  -- Example usage in adminApi.ts after admin actions
  RETURN NEW;
END;
$$;

-- =====================================================
-- INITIAL DATA - CREATE DEFAULT SUPER ADMIN
-- =====================================================

-- NOTE: Run this separately after creating an admin user in Supabase Auth
-- Replace 'your-admin-user-id' with the actual UUID from auth.users
--
-- INSERT INTO admin_users (user_id, email, full_name, role, is_active)
-- VALUES (
--   'your-admin-user-id',
--   'admin@petvisit.com',
--   'Super Admin',
--   'super_admin',
--   true
-- );

-- =====================================================
-- VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- View for user statistics
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'active') as active_users,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_today,
  COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days') as new_this_month
FROM users;

-- View for doctor statistics
CREATE OR REPLACE VIEW admin_doctor_stats AS
SELECT
  COUNT(*) as total_doctors,
  COUNT(*) FILTER (WHERE is_active = true) as active_doctors,
  COUNT(*) FILTER (WHERE approval = 'pending') as pending_approval,
  COUNT(*) FILTER (WHERE approval = 'approved') as approved_doctors,
  COUNT(*) FILTER (WHERE approval = 'rejected') as rejected_doctors,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_today
FROM doctors;

-- View for booking statistics
CREATE OR REPLACE VIEW admin_booking_stats AS
SELECT
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
  COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as bookings_today,
  COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
  COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as platform_revenue
FROM bookings;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to admin tables
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON admin_activity_logs TO authenticated;
GRANT ALL ON user_reports TO authenticated;
GRANT ALL ON doctor_verification_requests TO authenticated;
GRANT ALL ON platform_analytics TO authenticated;

-- Grant access to views
GRANT SELECT ON admin_user_stats TO authenticated;
GRANT SELECT ON admin_doctor_stats TO authenticated;
GRANT SELECT ON admin_booking_stats TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE admin_users IS 'Stores admin user profiles with role-based access control';
COMMENT ON TABLE admin_activity_logs IS 'Audit trail for all admin actions';
COMMENT ON TABLE user_reports IS 'User-generated reports for flagged accounts';
COMMENT ON TABLE doctor_verification_requests IS 'Doctor credential verification workflow';
COMMENT ON TABLE platform_analytics IS 'Daily aggregated platform statistics';

COMMENT ON COLUMN admin_users.role IS 'super_admin: full access, admin: manage users/doctors, moderator: manage content, support: view only';
COMMENT ON COLUMN admin_users.permissions IS 'JSON array of specific permissions for fine-grained access control';
COMMENT ON COLUMN users.status IS 'User account status: active, inactive, suspended, pending';
