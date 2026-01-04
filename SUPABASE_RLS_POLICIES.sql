-- ================================================================
-- Supabase Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor to fix 401 errors
-- ================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow anon users to check if email exists (for registration)
CREATE POLICY "Allow email existence check"
ON users FOR SELECT
TO anon
USING (true);

-- ================================================================
-- Optional: If you have pets, addresses, bookings tables
-- ================================================================

-- Enable RLS on pets table
ALTER TABLE IF EXISTS pets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own pets
CREATE POLICY "Users can read own pets"
ON pets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own pets
CREATE POLICY "Users can insert own pets"
ON pets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pets
CREATE POLICY "Users can update own pets"
ON pets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pets
CREATE POLICY "Users can delete own pets"
ON pets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================================
-- Addresses table
-- ================================================================

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
-- Bookings table
-- ================================================================

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
-- Cart items table
-- ================================================================

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
-- Orders table
-- ================================================================

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
-- Products table (should be readable by everyone)
-- ================================================================

ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
ON products FOR SELECT
TO authenticated, anon
USING (true);

-- ================================================================
-- Grooming packages (should be readable by everyone)
-- ================================================================

ALTER TABLE IF EXISTS grooming_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read grooming packages"
ON grooming_packages FOR SELECT
TO authenticated, anon
USING (true);

-- ================================================================
-- Doctors (should be readable by everyone)
-- ================================================================

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
