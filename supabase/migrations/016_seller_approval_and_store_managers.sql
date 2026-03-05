-- Migration: Add approval and margin for sellers (Doctors, Grooming Stores, Store Managers)

-- 1. Create store_managers table
CREATE TABLE IF NOT EXISTS store_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  license_url TEXT, -- Document section for store license
  margin_percentage DECIMAL(5, 2) DEFAULT 10.00, -- Admin margin percentage
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update grooming_stores table to include approval and margin
ALTER TABLE grooming_stores 
ADD COLUMN IF NOT EXISTS license_url TEXT,
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Update doctors table (add margin if missing)
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5, 2) DEFAULT 10.00;

-- 4. Update product_sellers table to support store_manager
-- First, handle the check constraint if it exists
DO $$
BEGIN
  ALTER TABLE product_sellers DROP CONSTRAINT IF EXISTS product_sellers_seller_type_check;
  ALTER TABLE product_sellers ADD CONSTRAINT product_sellers_seller_type_check 
  CHECK (seller_type IN ('grooming_store', 'doctor', 'admin', 'store_manager'));
END $$;

-- 5. Add margin tracking and settlement to orders/order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS seller_type TEXT CHECK (seller_type IN ('grooming_store', 'doctor', 'admin', 'store_manager')),
ADD COLUMN IF NOT EXISTS admin_margin_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- 6. RLS for store_managers
ALTER TABLE store_managers ENABLE ROW LEVEL SECURITY;

-- Admins can manage all store_managers
DROP POLICY IF EXISTS "Admin full access to store_managers" ON store_managers;
CREATE POLICY "Admin full access to store_managers" ON store_managers
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Store managers can view own profile
DROP POLICY IF EXISTS "Store managers can view own profile" ON store_managers;
CREATE POLICY "Store managers can view own profile" ON store_managers
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Store managers can update own profile
DROP POLICY IF EXISTS "Store managers can update own profile" ON store_managers;
CREATE POLICY "Store managers can update own profile" ON store_managers
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_store_managers_updated_at ON store_managers;
CREATE TRIGGER update_store_managers_updated_at
    BEFORE UPDATE ON store_managers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_managers_user_id ON store_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_store_managers_approval_status ON store_managers(approval_status);
CREATE INDEX IF NOT EXISTS idx_grooming_stores_approval_status ON grooming_stores(approval_status);
