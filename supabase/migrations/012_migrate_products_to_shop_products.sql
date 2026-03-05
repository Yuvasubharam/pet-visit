-- =====================================================
-- Migration: Migrate products to shop_products
-- =====================================================
-- This migration:
-- 1. Copies all existing products from the 'products' table to 'shop_products'
-- 2. Updates prescription_products FK to reference shop_products
-- 3. Maintains data integrity and backwards compatibility

-- =====================================================
-- STEP 1: Copy all products from products to shop_products
-- =====================================================

INSERT INTO shop_products (
  id,
  name,
  description,
  category,
  base_price,
  stock_quantity,
  sku,
  main_image,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  description,
  category,
  price,
  stock,
  name || '-' || LEFT(id::text, 8), -- Generate unique SKU from name and id
  image,
  true, -- Mark as active
  created_at,
  COALESCE(created_at, NOW()) -- Use created_at as updated_at
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM shop_products WHERE shop_products.id = products.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: Update prescription_products FK constraint
-- =====================================================

-- First, drop the existing foreign key constraint
ALTER TABLE prescription_products
DROP CONSTRAINT IF EXISTS prescription_products_product_id_fkey;

-- Add the new foreign key constraint pointing to shop_products
ALTER TABLE prescription_products
ADD CONSTRAINT prescription_products_product_id_fkey
FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 3: Verify migration success
-- =====================================================

-- Check if all products were migrated
DO $$
DECLARE
  products_count INTEGER;
  shop_products_count INTEGER;
  unmatched_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO products_count FROM products;
  SELECT COUNT(*) INTO shop_products_count FROM shop_products;
  SELECT COUNT(*) INTO unmatched_count FROM prescription_products pp 
  WHERE NOT EXISTS (SELECT 1 FROM shop_products sp WHERE sp.id = pp.product_id);
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  - Products in old table: %', products_count;
  RAISE NOTICE '  - Products in shop_products: %', shop_products_count;
  RAISE NOTICE '  - Unmatched prescription products: %', unmatched_count;
  
  IF unmatched_count > 0 THEN
    RAISE EXCEPTION 'ERROR: % prescription products have IDs that do not exist in shop_products!', unmatched_count;
  ELSE
    RAISE NOTICE '✓ Migration successful! All prescription products reference valid shop_products.';
  END IF;
END
$$;
