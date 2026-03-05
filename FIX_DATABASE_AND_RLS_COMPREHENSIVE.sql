-- =====================================================
-- COMPREHENSIVE DATABASE & RLS FIX
-- =====================================================
-- This script:
-- 1. Creates missing store_managers table
-- 2. Ensures product_sellers table exists with correct schema
-- 3. Updates is_admin() function for robust role checking
-- 4. Fixes RLS policies for shop_products and product_sellers
-- 5. Updates other related tables (grooming_stores, doctors)
-- =====================================================

-- 1. Create store_managers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.store_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    license_url TEXT,
    margin_percentage DECIMAL(5, 2) DEFAULT 10.0,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Ensure product_sellers table exists with correct schema
CREATE TABLE IF NOT EXISTS public.product_sellers (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null references public.shop_products (id) on delete CASCADE,
  seller_id uuid not null references public.users (id) on delete CASCADE,
  seller_price numeric(10, 2) not null check (seller_price >= 0),
  seller_stock integer not null default 0 check (seller_stock >= 0),
  seller_sku text null,
  seller_type text not null default 'grooming_store' check (seller_type in ('grooming_store', 'doctor', 'admin', 'store_manager')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  rejection_reason text null,
  approved_by uuid references public.users (id) on delete set null,
  approved_at timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint product_sellers_pkey primary key (id),
  constraint product_sellers_unique_seller unique (product_id, seller_id)
);

-- 3. Robust is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND role IN ('super_admin', 'admin', 'moderator', 'support')
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = check_user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Fix shop_products RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_products_admin_all" ON public.shop_products;
CREATE POLICY "shop_products_admin_all" ON public.shop_products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "shop_products_public_select" ON public.shop_products;
CREATE POLICY "shop_products_public_select" ON public.shop_products
    FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin());

-- Additional policy for sellers to manage their own products if they created them
DROP POLICY IF EXISTS "Sellers manage own products" ON public.shop_products;
CREATE POLICY "Sellers manage own products" ON public.shop_products
    FOR ALL TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- 5. Fix product_sellers RLS
ALTER TABLE public.product_sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all product_sellers" ON public.product_sellers;
CREATE POLICY "Admins can manage all product_sellers" ON public.product_sellers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sellers can manage own listings" ON public.product_sellers;
CREATE POLICY "Sellers can manage own listings" ON public.product_sellers
    FOR ALL TO authenticated
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Public view approved sellers" ON public.product_sellers;
CREATE POLICY "Public view approved sellers" ON public.product_sellers
    FOR SELECT TO authenticated
    USING (approval_status = 'approved' AND is_active = true);

-- 6. Fix store_managers RLS
ALTER TABLE public.store_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage store_managers" ON public.store_managers;
CREATE POLICY "Admins can manage store_managers" ON public.store_managers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Managers can view own profile" ON public.store_managers;
CREATE POLICY "Managers can view own profile" ON public.store_managers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 7. Fix order_items RLS for sellers
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own order items" ON public.order_items;
CREATE POLICY "Sellers can view own order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        seller_id = auth.uid() OR 
        public.is_admin()
    );

DROP POLICY IF EXISTS "Sellers can update fulfillment status" ON public.order_items;
CREATE POLICY "Sellers can update fulfillment status" ON public.order_items
    FOR UPDATE TO authenticated
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

-- 8. Add missing columns to grooming_stores and doctors if they don't exist
ALTER TABLE public.grooming_stores 
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5, 2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5, 2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Ensure triggers exist for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_store_managers_updated_at ON public.store_managers;
CREATE TRIGGER update_store_managers_updated_at BEFORE UPDATE ON public.store_managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_sellers_updated_at ON public.product_sellers;
CREATE TRIGGER update_product_sellers_updated_at BEFORE UPDATE ON public.product_sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.store_managers TO authenticated;
GRANT ALL ON public.product_sellers TO authenticated;
GRANT ALL ON public.shop_products TO authenticated;

-- Success Notice
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema and RLS policies have been fixed!';
END $$;
