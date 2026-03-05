-- Migration: Add pricing columns to product_variations table
-- This adds base_price, sale_price, and purchase_price columns for better pricing management

-- Add base_price column (MRP for the variation)
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) NULL;

-- Add sale_price column (discounted price)
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2) NULL;

-- Add purchase_price column (cost price for margin tracking)
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) NULL;

-- Optional: Update existing variations to set base_price from price_adjustment
-- This calculates base_price by adding price_adjustment to the parent product's base_price
-- Uncomment and run if you want to migrate existing data:

/*
UPDATE product_variations pv
SET base_price = (
    SELECT sp.base_price + pv.price_adjustment
    FROM shop_products sp
    WHERE sp.id = pv.product_id
)
WHERE pv.base_price IS NULL;
*/

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_variations'
AND column_name IN ('base_price', 'sale_price', 'purchase_price');
