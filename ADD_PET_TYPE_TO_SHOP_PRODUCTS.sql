ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS pet_types text[] DEFAULT ARRAY['dog', 'cat'];

COMMENT ON COLUMN public.shop_products.pet_types IS 'Array of pet types this product is meant for: dog, cat, bird, rabbit, etc.';
