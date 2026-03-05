ALTER TABLE public.product_variations
ADD COLUMN IF NOT EXISTS sale_price numeric(10, 2) NULL;

ALTER TABLE public.product_variations
ADD CONSTRAINT product_variations_sale_price_check 
  CHECK ((sale_price IS NULL) OR (sale_price > 0))
  NOT VALID;

COMMENT ON COLUMN public.product_variations.sale_price IS 'Optional sale/discounted price. If set, this price overrides the calculated price (base + adjustment). Must be greater than 0 if set.';

CREATE INDEX IF NOT EXISTS idx_product_variations_sale_price 
  ON public.product_variations USING btree (sale_price) TABLESPACE pg_default;
