-- =====================================================
-- FIX ADMIN RLS POLICIES FOR DASHBOARD DATA
-- =====================================================
-- This script ensures admins can read all necessary data
-- for the dashboard statistics.
-- =====================================================

-- 1. ADMIN ACCESS TO bookings TABLE
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 2. ADMIN ACCESS TO users TABLE
-- First check if RLS is enabled on users (it usually should be)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. ADMIN ACCESS TO doctors TABLE
DROP POLICY IF EXISTS "Admins can manage all doctors" ON doctors;
CREATE POLICY "Admins can manage all doctors" ON doctors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 4. ADMIN ACCESS TO orders TABLE (for pending orders count)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. ADMIN ACCESS TO doctor_earnings TABLE
ALTER TABLE doctor_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all doctor earnings" ON doctor_earnings;
CREATE POLICY "Admins can manage all doctor earnings" ON doctor_earnings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- 6. ADMIN ACCESS TO grooming_store_earnings TABLE
ALTER TABLE grooming_store_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all grooming store earnings" ON grooming_store_earnings;
CREATE POLICY "Admins can manage all grooming store earnings" ON grooming_store_earnings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'moderator', 'support')
    )
  );

-- SUCCESS NOTICE
DO $$
BEGIN
  RAISE NOTICE '✅ Admin RLS policies for dashboard updated successfully!';
END $$;
