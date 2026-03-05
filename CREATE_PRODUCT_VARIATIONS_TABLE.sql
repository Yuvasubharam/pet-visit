CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variation_name character varying(100) NOT NULL,
  variation_value character varying(100) NOT NULL,
  price_adjustment numeric(10, 2) NULL DEFAULT 0,
  sale_price numeric(10, 2) NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  sku character varying(100) NULL,
  image text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT product_variations_pkey PRIMARY KEY (id),
  CONSTRAINT product_variations_product_id_fkey FOREIGN KEY (product_id) 
    REFERENCES shop_products (id) ON DELETE CASCADE,
  CONSTRAINT product_variations_stock_quantity_check CHECK ((stock_quantity >= 0)),
  CONSTRAINT product_variations_sale_price_check CHECK ((sale_price IS NULL) OR (sale_price > 0))
) TABLESPACE pg_default;

COMMENT ON COLUMN public.product_variations.price_adjustment IS 'Price adjustment from base product price. Final price = base_price + price_adjustment. Use with sale_price for discounted variations.';
COMMENT ON COLUMN public.product_variations.sale_price IS 'Optional sale/discounted price. If set, this price overrides the calculated price (base + adjustment). Must be greater than 0 if set.';

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id 
  ON public.product_variations USING btree (product_id) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS update_product_variations_updated_at ON product_variations;

CREATE TRIGGER update_product_variations_updated_at 
  BEFORE UPDATE ON product_variations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
