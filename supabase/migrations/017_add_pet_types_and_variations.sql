-- Migration: Add pet_types to shop_products and create product_variations table
-- Run this in your Supabase SQL Editor

-- 1. Add pet_types column to shop_products (array for multi-select)
ALTER TABLE public.shop_products
ADD COLUMN IF NOT EXISTS pet_types text[] DEFAULT ARRAY['dog', 'cat'];

-- 2. Add sale_price and has_attribute_pricing columns
ALTER TABLE public.shop_products
ADD COLUMN IF NOT EXISTS sale_price numeric(10, 2) NULL;

ALTER TABLE public.shop_products
ADD COLUMN IF NOT EXISTS has_attribute_pricing boolean DEFAULT false;

-- 3. Create product_variations table (if not exists)
CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variation_name character varying(100) NOT NULL,
  variation_value character varying(100) NOT NULL,
  price_adjustment numeric(10, 2) NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  sku character varying(100) NULL,
  image text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT product_variations_pkey PRIMARY KEY (id),
  CONSTRAINT product_variations_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES shop_products (id) ON DELETE CASCADE,
  CONSTRAINT product_variations_stock_quantity_check CHECK ((stock_quantity >= 0))
) TABLESPACE pg_default;

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id
ON public.product_variations USING btree (product_id) TABLESPACE pg_default;

-- 5. Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_product_variations_updated_at ON product_variations;

CREATE TRIGGER update_product_variations_updated_at
BEFORE UPDATE ON product_variations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS on product_variations
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for product_variations
-- Allow public read access for active variations
DROP POLICY IF EXISTS "Allow public read access to product variations" ON public.product_variations;
CREATE POLICY "Allow public read access to product variations"
ON public.product_variations
FOR SELECT
USING (is_active = true);

-- Allow admin/store managers to manage variations
DROP POLICY IF EXISTS "Allow admin to manage product variations" ON public.product_variations;
CREATE POLICY "Allow admin to manage product variations"
ON public.product_variations
FOR ALL
USING (
  -- Admin users can manage all variations
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  -- Users with admin/super_admin role in users table
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
  OR
  -- Sellers who own the product via product_sellers table
  EXISTS (
    SELECT 1 FROM public.product_sellers ps
    WHERE ps.product_id = product_variations.product_id
    AND ps.seller_id = auth.uid()
  )
);

-- 8. Create index for pet_types array for efficient filtering
CREATE INDEX IF NOT EXISTS idx_shop_products_pet_types
ON public.shop_products USING GIN (pet_types);

-- 9. Update existing products to have default pet_types
UPDATE public.shop_products
SET pet_types = ARRAY['dog', 'cat']
WHERE pet_types IS NULL;
