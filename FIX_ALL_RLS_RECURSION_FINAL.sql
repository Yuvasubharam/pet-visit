-- ============================================================================
-- FINAL COMPREHENSIVE FIX FOR RLS INFINITE RECURSION AND PERFORMANCE
-- ============================================================================
-- This script eliminates infinite recursion by using SECURITY DEFINER functions.
-- These functions run with the privileges of the creator (postgres/superuser)
-- and bypass RLS, preventing the "infinite recursion detected" error.
-- ============================================================================

-- 1. Create Role-Checking Functions (Security Definer)
-- ----------------------------------------------------------------------------

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND role IN ('super_admin', 'admin', 'moderator', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if a user is a doctor
CREATE OR REPLACE FUNCTION public.is_doctor(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND role = 'doctor'
  ) OR EXISTS (
    SELECT 1 FROM public.doctors
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if a user is a grooming store owner
CREATE OR REPLACE FUNCTION public.is_groomer(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND role = 'groomer'
  ) OR EXISTS (
    SELECT 1 FROM public.grooming_stores
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Cleanup Existing Problematic Policies
-- ----------------------------------------------------------------------------

-- Bookings table
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can view their assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can update their assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can accept unassigned bookings" ON bookings;
DROP POLICY IF EXISTS "Grooming stores can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Grooming stores can update booking status" ON bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;

-- Users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Doctors table
DROP POLICY IF EXISTS "Admins can manage all doctors" ON doctors;
DROP POLICY IF EXISTS "Anyone can view active doctors" ON doctors;
DROP POLICY IF EXISTS "Anyone can view all active doctors" ON doctors;
DROP POLICY IF EXISTS "doctors_select_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_all_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_all_admin_policy" ON doctors;

-- Grooming stores table
DROP POLICY IF EXISTS "Grooming store owners can view own store" ON grooming_stores;
DROP POLICY IF EXISTS "Grooming store owners can update own store" ON grooming_stores;
DROP POLICY IF EXISTS "Public can view active grooming stores" ON grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_select_policy" ON grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_all_policy" ON grooming_stores;
DROP POLICY IF EXISTS "grooming_stores_all_admin_policy" ON grooming_stores;

-- Orders table
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;

-- Pets and Addresses
DROP POLICY IF EXISTS "Users can view own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;
DROP POLICY IF EXISTS "pets_all_policy" ON pets;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "addresses_all_policy" ON addresses;

-- Admin tables
DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can create activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admins can read activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admins can manage reports" ON user_reports;
DROP POLICY IF EXISTS "Admins can manage verification requests" ON doctor_verification_requests;
DROP POLICY IF EXISTS "Admins can read platform analytics" ON platform_analytics;
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_all_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_activity_logs_select_policy" ON admin_activity_logs;
DROP POLICY IF EXISTS "admin_activity_logs_insert_policy" ON admin_activity_logs;
DROP POLICY IF EXISTS "user_reports_all_policy" ON user_reports;
DROP POLICY IF EXISTS "doctor_verification_requests_all_policy" ON doctor_verification_requests;
DROP POLICY IF EXISTS "platform_analytics_select_policy" ON platform_analytics;

-- 3. Apply New Non-Recursive Policies
-- ----------------------------------------------------------------------------

-- BOOKINGS POLICIES
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.is_admin() OR 
    (public.is_doctor() AND (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR doctor_id IS NULL)) OR
    (public.is_groomer() AND grooming_store_id IN (SELECT id FROM grooming_stores WHERE user_id = auth.uid()))
  );

CREATE POLICY "bookings_update_policy" ON bookings
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.is_admin() OR 
    (public.is_doctor() AND (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR doctor_id IS NULL)) OR
    (public.is_groomer() AND grooming_store_id IN (SELECT id FROM grooming_stores WHERE user_id = auth.uid()))
  );

CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- USERS POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- DOCTORS POLICIES
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_select_policy" ON doctors
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "doctors_all_policy" ON doctors
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- GROOMING STORES POLICIES
ALTER TABLE grooming_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grooming_stores_select_policy" ON grooming_stores
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "grooming_stores_all_policy" ON grooming_stores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ORDERS POLICIES
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- PETS POLICIES
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pets_all_policy" ON pets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ADDRESSES POLICIES
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_all_policy" ON addresses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ADMIN_USERS POLICIES
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_select_policy" ON admin_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "admin_users_all_policy" ON admin_users
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ADMIN_ACTIVITY_LOGS POLICIES
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_activity_logs_select_policy" ON admin_activity_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_activity_logs_insert_policy" ON admin_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- USER_REPORTS POLICIES
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reports_all_policy" ON user_reports
  FOR ALL TO authenticated
  USING (public.is_admin());

-- DOCTOR_VERIFICATION_REQUESTS POLICIES
ALTER TABLE doctor_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_verification_requests_all_policy" ON doctor_verification_requests
  FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND id = doctor_id));

-- PLATFORM_ANALYTICS POLICIES
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_analytics_select_policy" ON platform_analytics
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 4. SUCCESS NOTICE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Infinite Recursion Fix Applied!';
  RAISE NOTICE '🚀 SECURITY DEFINER functions created for safe role checks.';
  RAISE NOTICE '📊 All dashboard data should now load correctly without 500 errors.';
END $$;
