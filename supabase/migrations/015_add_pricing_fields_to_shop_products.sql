-- =====================================================
-- Add Pricing Fields to shop_products
-- =====================================================
-- Adds:
-- 1. sale_price - Discount price for promotions
-- 2. attribute_based_pricing - Enable/disable attribute-based pricing
-- 3. Indexes for pricing queries

-- =====================================================
-- STEP 1: Add pricing columns to shop_products
-- =====================================================

ALTER TABLE shop_products 
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS has_attribute_pricing BOOLEAN DEFAULT false;

-- Add constraint to ensure sale_price is less than base_price
ALTER TABLE shop_products
ADD CONSTRAINT shop_products_sale_price_check CHECK (
  sale_price IS NULL OR (sale_price > 0 AND sale_price < base_price)
);

CREATE INDEX IF NOT EXISTS idx_shop_products_base_price ON shop_products(base_price);
CREATE INDEX IF NOT EXISTS idx_shop_products_sale_price ON shop_products(sale_price);
CREATE INDEX IF NOT EXISTS idx_shop_products_has_attribute_pricing ON shop_products(has_attribute_pricing);

-- =====================================================
-- STEP 2: Create attribute_pricing table (for color, size, etc. variant pricing)
-- =====================================================

CREATE TABLE IF NOT EXISTS attribute_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product this pricing applies to
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  
  -- Which attribute (e.g., 'Color', 'Size')
  attribute_name VARCHAR(100) NOT NULL,
  
  -- The specific value (e.g., 'Red', 'Large')
  attribute_value VARCHAR(100) NOT NULL,
  
  -- Pricing for this attribute combination
  price_adjustment DECIMAL(10, 2) DEFAULT 0, -- Price change relative to base_price
  adjusted_price DECIMAL(10, 2) NOT NULL, -- Final price = base_price + price_adjustment
  sale_price DECIMAL(10, 2), -- Optional sale price for this variant
  
  -- Stock for this specific variant
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku VARCHAR(100) UNIQUE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT attribute_pricing_unique UNIQUE (product_id, attribute_name, attribute_value)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attribute_pricing_product_id ON attribute_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_attribute_pricing_attribute_name ON attribute_pricing(attribute_name);
CREATE INDEX IF NOT EXISTS idx_attribute_pricing_attribute_value ON attribute_pricing(attribute_value);
CREATE INDEX IF NOT EXISTS idx_attribute_pricing_is_active ON attribute_pricing(is_active);

-- =====================================================
-- STEP 3: Add trigger for attribute_pricing updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_attribute_pricing_updated_at ON attribute_pricing;
CREATE TRIGGER update_attribute_pricing_updated_at
    BEFORE UPDATE ON attribute_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 4: RLS Policies for attribute_pricing
-- =====================================================

ALTER TABLE attribute_pricing ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "Admins manage attribute_pricing" ON attribute_pricing;
CREATE POLICY "Admins manage attribute_pricing"
  ON attribute_pricing
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

-- Public can view active pricing
DROP POLICY IF EXISTS "Public read active attribute_pricing" ON attribute_pricing;
CREATE POLICY "Public read active attribute_pricing"
  ON attribute_pricing
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- STEP 5: Function to calculate effective price for attribute
-- =====================================================

CREATE OR REPLACE FUNCTION get_attribute_price(
  p_product_id UUID,
  p_attribute_name VARCHAR,
  p_attribute_value VARCHAR
)
RETURNS TABLE (
  base_price DECIMAL,
  sale_price DECIMAL,
  adjusted_price DECIMAL,
  attribute_sale_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.base_price,
    sp.sale_price,
    COALESCE(ap.adjusted_price, sp.base_price),
    ap.sale_price
  FROM shop_products sp
  LEFT JOIN attribute_pricing ap ON (
    ap.product_id = sp.id
    AND ap.attribute_name = get_attribute_price.p_attribute_name
    AND ap.attribute_value = get_attribute_price.p_attribute_value
    AND ap.is_active = true
  )
  WHERE sp.id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Added sale_price and has_attribute_pricing to shop_products';
  RAISE NOTICE '✓ Created attribute_pricing table for variant pricing';
  RAISE NOTICE '✓ Configured RLS policies for attribute pricing';
  RAISE NOTICE '✓ Created pricing calculation function';
  RAISE NOTICE '✓ Pricing system ready!';
END
$$;
