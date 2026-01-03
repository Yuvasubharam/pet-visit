-- Migration: Add pet and main_category columns to products table
-- This enables filtering products by pet type and main category in the marketplace

-- Add pet column (specifies which pet type the product is for)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pet text DEFAULT 'all';

-- Add main_category column (groups products into major categories)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS main_category text DEFAULT 'food';

-- Add comments for documentation
COMMENT ON COLUMN public.products.pet IS 'Pet type: all, dog, cat, rabbits, turtles, birds, other';
COMMENT ON COLUMN public.products.main_category IS 'Main category: food, toys, care, medicine';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_pet ON public.products(pet);
CREATE INDEX IF NOT EXISTS idx_products_main_category ON public.products(main_category);
CREATE INDEX IF NOT EXISTS idx_products_pet_main_category ON public.products(pet, main_category);

-- Update existing products to have default values if needed
UPDATE public.products
SET pet = 'all', main_category = 'food'
WHERE pet IS NULL OR main_category IS NULL;
