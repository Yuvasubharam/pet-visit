-- ================================================================
-- Fix Supabase RLS Policies - Drop and Recreate
-- Run this to fix the 401 Unauthorized errors
-- ================================================================

-- ================================================================
-- USERS TABLE
-- ================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow email existence check" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow anon users to check if email exists (for account merging)
CREATE POLICY "Allow email existence check"
ON users FOR SELECT
TO anon
USING (true);

-- ================================================================
-- PETS TABLE
-- ================================================================

DROP POLICY IF EXISTS "Users can read own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;

ALTER TABLE IF EXISTS pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pets"
ON pets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pets"
ON pets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets"
ON pets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pets"
ON pets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================================
-- ADDRESSES TABLE
-- ================================================================

DROP POLICY IF EXISTS "Users can read own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;

ALTER TABLE IF EXISTS addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own addresses"
ON addresses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
ON addresses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON addresses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
ON addresses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================================
-- BOOKINGS TABLE
-- ================================================================

DROP POLICY IF EXISTS "Users can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- CART ITEMS TABLE
-- ================================================================

DROP POLICY IF EXISTS "Users can read own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

ALTER TABLE IF EXISTS cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cart items"
ON cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================================
-- ORDERS TABLE
-- ================================================================

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
ON orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- PRODUCTS TABLE (Public Read)
-- ================================================================

DROP POLICY IF EXISTS "Anyone can read products" ON products;

ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
ON products FOR SELECT
TO authenticated, anon
USING (true);

-- ================================================================
-- GROOMING PACKAGES TABLE (Public Read)
-- ================================================================

DROP POLICY IF EXISTS "Anyone can read grooming packages" ON grooming_packages;

ALTER TABLE IF EXISTS grooming_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read grooming packages"
ON grooming_packages FOR SELECT
TO authenticated, anon
USING (true);

-- ================================================================
-- DOCTORS TABLE (Public Read, Self Update)
-- ================================================================

DROP POLICY IF EXISTS "Anyone can read doctors" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;

ALTER TABLE IF EXISTS doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read doctors"
ON doctors FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Doctors can update own profile"
ON doctors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- GROOMING STORES TABLE (Public Read, Self Update)
-- ================================================================

DROP POLICY IF EXISTS "Anyone can read grooming stores" ON grooming_stores;
DROP POLICY IF EXISTS "Stores can update own profile" ON grooming_stores;

ALTER TABLE IF EXISTS grooming_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read grooming stores"
ON grooming_stores FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Stores can update own profile"
ON grooming_stores FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- ORDER ITEMS TABLE
-- ================================================================

DROP POLICY IF EXISTS "Users can read own order items" ON order_items;

ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);
