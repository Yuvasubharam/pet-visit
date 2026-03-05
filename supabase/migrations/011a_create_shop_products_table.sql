-- =====================================================
-- CREATE SHOP_PRODUCTS TABLE
-- =====================================================
-- This migration creates the shop_products table
-- which is the base table for all products in the shop

-- Create shop_products table
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic product info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  sale_price DECIMAL(10, 2),
  
  -- Inventory
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku TEXT UNIQUE,
  
  -- Images
  main_image TEXT,
  
  -- Attribute pricing
  has_attribute_pricing BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT shop_products_sale_price_check CHECK (
    sale_price IS NULL OR (sale_price > 0 AND sale_price < base_price)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_active ON shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_sku ON shop_products(sku);
CREATE INDEX IF NOT EXISTS idx_shop_products_created_at ON shop_products(created_at);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_shop_products_updated_at ON shop_products;
CREATE TRIGGER update_shop_products_updated_at
    BEFORE UPDATE ON shop_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on shop_products
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_products (will be extended in migration 013)
-- For now, allow all authenticated users to select
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access to shop_products') THEN
        CREATE POLICY "Allow read access to shop_products" ON shop_products
          FOR SELECT
          TO authenticated
          USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin full access to shop_products') THEN
        CREATE POLICY "Allow admin full access to shop_products" ON shop_products
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
    END IF;
END $$;
