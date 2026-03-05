-- =====================================================
-- FIX SHOP PRODUCTS RLS POLICIES
-- =====================================================
-- This script fixes the 403 Forbidden error when saving products
-- by ensuring RLS policies use the non-recursive public.is_admin() function.
-- =====================================================

-- 1. SHOP_PRODUCTS
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to shop_products" ON shop_products;
DROP POLICY IF EXISTS "Public read access to active products" ON shop_products;
DROP POLICY IF EXISTS "shop_products_select" ON shop_products;
DROP POLICY IF EXISTS "shop_products_all" ON shop_products;
DROP POLICY IF EXISTS "Allow read access to shop_products" ON shop_products;
DROP POLICY IF EXISTS "Allow admin full access to shop_products" ON shop_products;

CREATE POLICY "shop_products_admin_all" ON shop_products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "shop_products_public_select" ON shop_products
    FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin());

-- 2. PRODUCT_VARIATIONS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to product_variations" ON product_variations;
DROP POLICY IF EXISTS "Public read access to product_variations" ON product_variations;
DROP POLICY IF EXISTS "product_variations_select" ON product_variations;
DROP POLICY IF EXISTS "product_variations_all" ON product_variations;

CREATE POLICY "product_variations_admin_all" ON product_variations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "product_variations_public_select" ON product_variations
    FOR SELECT TO authenticated
    USING (true);

-- 3. PRODUCT_ATTRIBUTES
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to product_attributes" ON product_attributes;
DROP POLICY IF EXISTS "Public read access to product_attributes" ON product_attributes;

CREATE POLICY "product_attributes_admin_all" ON product_attributes
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "product_attributes_public_select" ON product_attributes
    FOR SELECT TO authenticated
    USING (true);

-- 4. ATTRIBUTE_PRICING
ALTER TABLE attribute_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage attribute_pricing" ON attribute_pricing;
DROP POLICY IF EXISTS "Public read active attribute_pricing" ON attribute_pricing;

CREATE POLICY "attribute_pricing_admin_all" ON attribute_pricing
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "attribute_pricing_public_select" ON attribute_pricing
    FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin());

-- 5. PRODUCT_CATEGORIES
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to product_categories" ON product_categories;
DROP POLICY IF EXISTS "Public read access to product_categories" ON product_categories;

CREATE POLICY "product_categories_admin_all" ON product_categories
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "product_categories_public_select" ON product_categories
    FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin());

-- 6. GROUPED_PRODUCTS
ALTER TABLE grouped_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to grouped_products" ON grouped_products;
DROP POLICY IF EXISTS "Public read access to active grouped_products" ON grouped_products;

CREATE POLICY "grouped_products_admin_all" ON grouped_products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "grouped_products_public_select" ON grouped_products
    FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin());

-- 7. GROUPED_PRODUCT_ITEMS
ALTER TABLE grouped_product_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to grouped_product_items" ON grouped_product_items;
DROP POLICY IF EXISTS "Public read access to grouped_product_items" ON grouped_product_items;

CREATE POLICY "grouped_product_items_admin_all" ON grouped_product_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "grouped_product_items_public_select" ON grouped_product_items
    FOR SELECT TO authenticated
    USING (true);

-- 8. GRANT PERMISSIONS
GRANT ALL ON shop_products TO authenticated;
GRANT ALL ON product_variations TO authenticated;
GRANT ALL ON product_attributes TO authenticated;
GRANT ALL ON attribute_pricing TO authenticated;
GRANT ALL ON product_categories TO authenticated;
GRANT ALL ON grouped_products TO authenticated;
GRANT ALL ON grouped_product_items TO authenticated;

-- SUCCESS NOTICE
DO $$
BEGIN
  RAISE NOTICE '✅ Shop Products RLS Fix Applied!';
  RAISE NOTICE '🚀 Admins can now manage all product-related tables.';
END $$;
