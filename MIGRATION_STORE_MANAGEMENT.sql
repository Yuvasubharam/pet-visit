-- =====================================================
-- SELLER MANAGEMENT & ORDER MARGINS MIGRATION
-- =====================================================

-- 1. Update grooming_stores table
ALTER TABLE grooming_stores 
ADD COLUMN IF NOT EXISTS license_url TEXT,
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5, 2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Create store_managers table
CREATE TABLE IF NOT EXISTS store_managers (
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

-- 3. Update doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5, 2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 4. Update shop_products table
ALTER TABLE shop_products
ADD COLUMN IF NOT EXISTS seller_id UUID,
ADD COLUMN IF NOT EXISTS seller_type TEXT CHECK (seller_type IN ('admin', 'store_manager', 'grooming_store', 'doctor')) DEFAULT 'admin';

-- 5. Update order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS seller_id UUID,
ADD COLUMN IF NOT EXISTS seller_type TEXT CHECK (seller_type IN ('admin', 'store_manager', 'grooming_store', 'doctor')),
ADD COLUMN IF NOT EXISTS admin_margin_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
ADD COLUMN IF NOT EXISTS allocated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 6. Add indexes
CREATE INDEX IF NOT EXISTS idx_store_managers_user_id ON store_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_seller ON shop_products(seller_type, seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment ON order_items(fulfillment_status);

-- 7. RLS Policies for store_managers
ALTER TABLE store_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage store_managers" ON store_managers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Managers can view own profile" ON store_managers
    FOR SELECT USING (user_id = auth.uid());

-- 8. RLS Policies for shop_products (Store Managers)
CREATE POLICY "Store managers can manage own products" ON shop_products
    FOR ALL USING (
        seller_id = auth.uid() AND seller_type = 'store_manager'
    );

-- 9. RLS Policies for order_items (Seller View)
CREATE POLICY "Sellers can view own order items" ON order_items
    FOR SELECT USING (
        seller_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Sellers can update fulfillment status" ON order_items
    FOR UPDATE USING (
        seller_id = auth.uid()
    ) WITH CHECK (
        seller_id = auth.uid()
    );
