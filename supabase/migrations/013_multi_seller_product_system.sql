-- =====================================================
-- Multi-Seller Product System with Admin Approval
-- =====================================================
-- Schema:
-- - shop_products: Admin-managed base products
-- - product_sellers: Seller listings (stores/doctors) with approval workflow
-- - Admin can approve/reject which sellers can sell each product
-- =====================================================

-- =====================================================
-- STEP 1: Add seller tracking to shop_products
-- =====================================================

-- Add created_by to track admin who created the product
ALTER TABLE shop_products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shop_products_created_by ON shop_products(created_by);

-- =====================================================
-- STEP 2: Create product_sellers table for multi-seller listings
-- =====================================================

CREATE TABLE IF NOT EXISTS product_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Seller details (store/doctor specific pricing and stock)
  seller_price DECIMAL(10, 2) NOT NULL CHECK (seller_price >= 0),
  seller_stock INTEGER NOT NULL DEFAULT 0 CHECK (seller_stock >= 0),
  seller_sku TEXT,
  
  -- Seller type (grooming_store, doctor, etc.)
  seller_type TEXT NOT NULL DEFAULT 'grooming_store' CHECK (seller_type IN ('grooming_store', 'doctor', 'admin')),
  
  -- Approval workflow (admin must approve each seller's listing)
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and timestamps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT product_sellers_unique_seller UNIQUE (product_id, seller_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_sellers_product_id ON product_sellers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sellers_seller_id ON product_sellers(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_sellers_seller_type ON product_sellers(seller_type);
CREATE INDEX IF NOT EXISTS idx_product_sellers_approval_status ON product_sellers(approval_status);
CREATE INDEX IF NOT EXISTS idx_product_sellers_is_active ON product_sellers(is_active);

-- =====================================================
-- STEP 3: Add trigger for updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_product_sellers_updated_at ON product_sellers;
CREATE TRIGGER update_product_sellers_updated_at
    BEFORE UPDATE ON product_sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 4: RLS Policies for product_sellers
-- =====================================================

ALTER TABLE product_sellers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with product_sellers
DROP POLICY IF EXISTS "Admins can manage all product_sellers" ON product_sellers;
CREATE POLICY "Admins can manage all product_sellers"
  ON product_sellers
  FOR ALL
  TO authenticated
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

-- Sellers can view their own product listings
DROP POLICY IF EXISTS "Sellers can view own product_sellers" ON product_sellers;
CREATE POLICY "Sellers can view own product_sellers"
  ON product_sellers
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Sellers can insert their own product listings (pending approval)
DROP POLICY IF EXISTS "Sellers can insert product_sellers" ON product_sellers;
CREATE POLICY "Sellers can insert product_sellers"
  ON product_sellers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND approval_status = 'pending'
  );

-- Sellers can update their own listings (price, stock, etc.) if pending or approved
DROP POLICY IF EXISTS "Sellers can update own product_sellers" ON product_sellers;
CREATE POLICY "Sellers can update own product_sellers"
  ON product_sellers
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Public can view only approved active product listings
DROP POLICY IF EXISTS "Public can view approved product_sellers" ON product_sellers;
CREATE POLICY "Public can view approved product_sellers"
  ON product_sellers
  FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved'
    AND is_active = true
  );

-- =====================================================
-- STEP 5: Update RLS policies for shop_products
-- =====================================================

-- Drop old policies and recreate them
DROP POLICY IF EXISTS "Allow read access to shop_products" ON shop_products;
DROP POLICY IF EXISTS "Allow admin full access to shop_products" ON shop_products;
DROP POLICY IF EXISTS "Public read access to active products" ON shop_products;
DROP POLICY IF EXISTS "Admin full access to shop_products" ON shop_products;

-- Public can view active shop products (regardless of seller listings)
CREATE POLICY "Public read access to active products"
  ON shop_products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins have full access to shop_products
CREATE POLICY "Admin full access to shop_products"
  ON shop_products
  FOR ALL
  TO authenticated
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

-- =====================================================
-- STEP 6: Verify migration
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Created product_sellers table with multi-seller support';
  RAISE NOTICE '✓ Added approval workflow for seller listings';
  RAISE NOTICE '✓ Configured RLS policies for seller access control';
  RAISE NOTICE '✓ Multi-seller system ready!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Admins can view all pending seller listings';
  RAISE NOTICE '2. Admins can approve/reject seller listings';
  RAISE NOTICE '3. Only approved listings are visible to customers';
  RAISE NOTICE '4. Sellers can have different prices and stock per product';
END
$$;
