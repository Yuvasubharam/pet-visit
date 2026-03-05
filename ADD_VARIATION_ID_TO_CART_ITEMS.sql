-- Add variation_id column to cart_items table
-- This allows storing which product variation was selected when adding to cart

-- Add the variation_id column
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_items_variation_id ON cart_items(variation_id);

-- Update RLS policies if needed (the existing policies should still work)
-- The variation_id is just additional data, not affecting access control
