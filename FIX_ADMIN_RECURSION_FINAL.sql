-- =====================================================
-- FIX INFINITE RECURSION IN ADMIN POLICIES
-- =====================================================
-- This script fixes the "infinite recursion detected" error by 
-- checking roles in the 'users' table instead of 'admin_users'.
-- =====================================================

-- 1. FIX admin_users POLICIES
DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;

-- Policy: Admins can read all admin user records
-- We check the 'role' column in the 'users' table to avoid recursion
CREATE POLICY "Admin users can read admin_users" ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- Policy: Super admins can manage all admin user records
CREATE POLICY "Super admins can manage admin_users" ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- 2. FIX admin_activity_logs POLICIES
DROP POLICY IF EXISTS "Admins can create activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admins can read activity logs" ON admin_activity_logs;

CREATE POLICY "Admins can create activity logs" ON admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

CREATE POLICY "Admins can read activity logs" ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 3. FIX user_reports POLICIES
DROP POLICY IF EXISTS "Admins can manage reports" ON user_reports;

CREATE POLICY "Admins can manage reports" ON user_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 4. FIX doctor_verification_requests POLICIES
DROP POLICY IF EXISTS "Admins can manage verification requests" ON doctor_verification_requests;

CREATE POLICY "Admins can manage verification requests" ON doctor_verification_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 5. FIX platform_analytics POLICIES
DROP POLICY IF EXISTS "Admins can read platform analytics" ON platform_analytics;

CREATE POLICY "Admins can read platform analytics" ON platform_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 6. FIX shop_products AND RELATED TABLES
DROP POLICY IF EXISTS "Admin full access to shop_products" ON shop_products;
DROP POLICY IF EXISTS "Admin full access to product_variations" ON product_variations;
DROP POLICY IF EXISTS "Admin full access to product_attributes" ON product_attributes;
DROP POLICY IF EXISTS "Admin full access to grouped_products" ON grouped_products;
DROP POLICY IF EXISTS "Admin full access to grouped_product_items" ON grouped_product_items;
DROP POLICY IF EXISTS "Admin full access to product_categories" ON product_categories;

-- Recreate policies using users table roles
CREATE POLICY "Admin full access to shop_products" ON shop_products
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')));

CREATE POLICY "Admin full access to product_variations" ON product_variations
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')));

CREATE POLICY "Admin full access to product_attributes" ON product_attributes
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')));

CREATE POLICY "Admin full access to grouped_products" ON grouped_products
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')));

CREATE POLICY "Admin full access to grouped_product_items" ON grouped_product_items
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')));

CREATE POLICY "Admin full access to product_categories" ON product_categories
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'admin')));

-- SUCCESS NOTICE
DO $$
BEGIN
  RAISE NOTICE '✅ Infinite recursion fixed in all admin-related policies!';
  RAISE NOTICE '🚀 Admin dashboard should now load without 500 errors.';
END $$;
