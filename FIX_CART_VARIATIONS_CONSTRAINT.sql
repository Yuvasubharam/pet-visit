-- FIX_CART_VARIATIONS_CONSTRAINT.sql
-- Run this in your Supabase SQL Editor to allow multiple variations of the same product in the cart

-- 1. Drop the existing unique constraint that only allows one entry per product
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- 2. Create a new unique index that includes variation_id
-- This allows different variations of the same product to be added separately
-- We use two indices to correctly handle the case where variation_id is NULL

-- Index for items WITH variations
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_user_product_variation 
ON public.cart_items (user_id, product_id, variation_id) 
WHERE variation_id IS NOT NULL;

-- Index for items WITHOUT variations (base products)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_user_product_no_variation 
ON public.cart_items (user_id, product_id) 
WHERE variation_id IS NULL;

-- Optional: Clean up any existing duplicates that might violate these new rules
-- (If you have multiple entries for the same user/product/variation, keep only one)
/*
DELETE FROM public.cart_items a USING (
      SELECT MIN(ctid) as keep_ctid, user_id, product_id, variation_id
      FROM public.cart_items
      GROUP BY user_id, product_id, variation_id
      HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.product_id = b.product_id 
AND (a.variation_id = b.variation_id OR (a.variation_id IS NULL AND b.variation_id IS NULL))
AND a.ctid != b.keep_ctid;
*/
