-- Fix cart_items foreign key constraint to reference shop_products instead of products
-- This resolves the 23503 error when adding shop products to cart

-- Drop the old foreign key constraint
ALTER TABLE public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

-- Add new foreign key constraint that references shop_products
ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.shop_products (id) ON DELETE CASCADE;
