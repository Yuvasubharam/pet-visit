-- ============================================================================
-- COMPREHENSIVE DATABASE FIX
-- Fixes: RLS Recursion, Missing Columns, 406 Errors
-- ============================================================================
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 0: DROP ALL EXISTING POLICIES FIRST (before dropping functions)
-- ============================================================================

-- Drop all policies that depend on the functions we need to recreate
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop policies from all tables that might use is_admin, is_doctor, is_groomer
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS TO PRODUCT_VARIATIONS
-- ============================================================================

-- Add base_price column (MRP for the variation)
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) NULL;

-- Add sale_price column (discounted price) - may already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variations' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE product_variations ADD COLUMN sale_price DECIMAL(10, 2) NULL;
  END IF;
END $$;

-- Add purchase_price column (cost price for margin tracking)
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) NULL;

-- ============================================================================
-- PART 2: FIX RLS INFINITE RECURSION WITH SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Now we can safely drop and recreate functions
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_doctor(UUID);
DROP FUNCTION IF EXISTS public.is_groomer(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = check_user_id;
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = check_user_id;
  RETURN user_role IN ('super_admin', 'admin', 'moderator', 'support');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if a user is a doctor
CREATE OR REPLACE FUNCTION public.is_doctor(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_doctor_record BOOLEAN;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = check_user_id;
  IF user_role = 'doctor' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.doctors WHERE user_id = check_user_id) INTO has_doctor_record;
  RETURN has_doctor_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if a user is a grooming store owner
CREATE OR REPLACE FUNCTION public.is_groomer(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_groomer_record BOOLEAN;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = check_user_id;
  IF user_role = 'groomer' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.grooming_stores WHERE user_id = check_user_id) INTO has_groomer_record;
  RETURN has_groomer_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================================
-- PART 3: FIX USERS TABLE RLS (Most Critical - Causes Recursion)
-- ============================================================================

-- Enable RLS (policies already dropped in PART 0)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Users can ALWAYS read their own profile (no function call needed)
-- This is the most important policy - prevents stuck loading
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admins can view all users (uses SECURITY DEFINER function)
CREATE POLICY "users_select_admin" ON users
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Anyone can insert their own profile
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- PART 4: FIX DOCTORS TABLE RLS
-- ============================================================================

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Allow public read of active doctors (for marketplace/booking)
CREATE POLICY "doctors_select_active" ON doctors
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Allow doctors to see their own profile (even if inactive)
CREATE POLICY "doctors_select_own" ON doctors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to see all doctors
CREATE POLICY "doctors_select_admin" ON doctors
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Allow doctors to update their own profile
CREATE POLICY "doctors_update_own" ON doctors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to update any doctor
CREATE POLICY "doctors_update_admin" ON doctors
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Allow insert for new doctors
CREATE POLICY "doctors_insert" ON doctors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- PART 5: FIX GROOMING_STORES TABLE RLS
-- ============================================================================

ALTER TABLE grooming_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grooming_stores_select_active" ON grooming_stores
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "grooming_stores_select_own" ON grooming_stores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "grooming_stores_select_admin" ON grooming_stores
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "grooming_stores_update_own" ON grooming_stores
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "grooming_stores_update_admin" ON grooming_stores
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "grooming_stores_insert" ON grooming_stores
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- PART 6: FIX BOOKINGS TABLE RLS
-- ============================================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Doctors can view bookings assigned to them
CREATE POLICY "bookings_select_doctor" ON bookings
  FOR SELECT TO authenticated
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- Doctors can view unassigned bookings (to accept them)
CREATE POLICY "bookings_select_unassigned" ON bookings
  FOR SELECT TO authenticated
  USING (
    doctor_id IS NULL AND
    public.is_doctor() AND
    service_type IN ('video_consultation', 'home_consultation', 'online_consultation')
  );

-- Grooming stores can view their bookings
CREATE POLICY "bookings_select_groomer" ON bookings
  FOR SELECT TO authenticated
  USING (
    grooming_store_id IN (SELECT id FROM grooming_stores WHERE user_id = auth.uid())
  );

-- Admins can view all bookings
CREATE POLICY "bookings_select_admin" ON bookings
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Users can create bookings
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own bookings
CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Doctors can update bookings assigned to them
CREATE POLICY "bookings_update_doctor" ON bookings
  FOR UPDATE TO authenticated
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- Doctors can accept unassigned bookings
CREATE POLICY "bookings_update_unassigned" ON bookings
  FOR UPDATE TO authenticated
  USING (
    doctor_id IS NULL AND
    public.is_doctor()
  );

-- Grooming stores can update their bookings
CREATE POLICY "bookings_update_groomer" ON bookings
  FOR UPDATE TO authenticated
  USING (
    grooming_store_id IN (SELECT id FROM grooming_stores WHERE user_id = auth.uid())
  );

-- Admins can update all bookings
CREATE POLICY "bookings_update_admin" ON bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- PART 7: FIX ADMIN TABLES RLS
-- ============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Users can ALWAYS check if they are an admin (their own record)
-- This is needed during initial login to determine role
CREATE POLICY "admin_users_select_own" ON admin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all admin records
CREATE POLICY "admin_users_select_all" ON admin_users
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Admins can insert/update/delete admin records
CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "admin_users_update" ON admin_users
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_users_delete" ON admin_users
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- PART 8: FIX OTHER COMMON TABLES
-- ============================================================================

-- PETS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pets_select" ON pets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "pets_all" ON pets
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ADDRESSES
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_all" ON addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select" ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "orders_insert" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update" ON orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- CART_ITEMS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_all" ON cart_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- SHOP_PRODUCTS (public read, admin write)
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_products_select" ON shop_products
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "shop_products_all" ON shop_products
  FOR ALL TO authenticated
  USING (public.is_admin());

-- PRODUCT_VARIATIONS (public read, admin write)
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variations_select" ON product_variations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "product_variations_all" ON product_variations
  FOR ALL TO authenticated
  USING (public.is_admin());

-- ADMIN_ACTIVITY_LOGS
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_activity_logs_select" ON admin_activity_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_activity_logs_insert" ON admin_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- USER_REPORTS
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reports_all" ON user_reports
  FOR ALL TO authenticated
  USING (public.is_admin());

-- DOCTOR_VERIFICATION_REQUESTS
ALTER TABLE doctor_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_verification_requests_select" ON doctor_verification_requests
  FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid() AND id = doctor_id));

CREATE POLICY "doctor_verification_requests_all" ON doctor_verification_requests
  FOR ALL TO authenticated
  USING (public.is_admin());

-- PLATFORM_ANALYTICS
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_analytics_select" ON platform_analytics
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- PART 9: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_doctor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_groomer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_variations'
AND column_name IN ('base_price', 'sale_price', 'purchase_price');

-- List all functions created
SELECT proname, prosecdef as security_definer
FROM pg_proc
WHERE proname IN ('is_admin', 'is_doctor', 'is_groomer', 'get_user_role');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'COMPREHENSIVE FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '1. Added base_price, sale_price, purchase_price to product_variations';
  RAISE NOTICE '2. Created SECURITY DEFINER functions for role checks';
  RAISE NOTICE '3. Fixed RLS policies on all major tables';
  RAISE NOTICE '4. Eliminated infinite recursion issues';
  RAISE NOTICE '============================================';
END $$;
