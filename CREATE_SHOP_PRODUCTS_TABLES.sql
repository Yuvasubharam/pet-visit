-- =====================================================
-- SHOP PRODUCTS MANAGEMENT TABLES (Admin Dashboard)
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Shop Products Table
CREATE TABLE IF NOT EXISTS shop_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(100) UNIQUE,
    images TEXT[] DEFAULT '{}',
    main_image TEXT,
    is_active BOOLEAN DEFAULT true,
    is_grouped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Product Variations Table (for color, size, material variants)
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    variation_name VARCHAR(100) NOT NULL, -- e.g., "Color", "Size"
    variation_value VARCHAR(100) NOT NULL, -- e.g., "Red", "Large"
    price_adjustment DECIMAL(10, 2) DEFAULT 0, -- Price difference from base
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(100),
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Product Attributes Table (for product specifications)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL, -- e.g., "Color", "Material"
    attribute_values TEXT[] NOT NULL, -- e.g., ["Red", "Blue", "Green"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Grouped Products Table (for bundled products)
CREATE TABLE IF NOT EXISTS grouped_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    final_price DECIMAL(10, 2) NOT NULL CHECK (final_price >= 0),
    discount_percentage DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Grouped Product Items Table (products in a bundle)
CREATE TABLE IF NOT EXISTS grouped_product_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grouped_product_id UUID NOT NULL REFERENCES grouped_products(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(grouped_product_id, product_id)
);

-- 6. Product Categories Table (optional - for managing categories)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO product_categories (name, description, icon, display_order) VALUES
    ('Pet Food', 'Dog and cat food, treats, and supplements', 'restaurant', 1),
    ('Toys', 'Interactive toys, chew toys, and play accessories', 'toys', 2),
    ('Accessories', 'Leashes, collars, beds, and carriers', 'pets', 3),
    ('Grooming', 'Shampoos, brushes, and grooming tools', 'content_cut', 4),
    ('Healthcare', 'Medicines, vitamins, and health supplements', 'medication', 5),
    ('Bedding', 'Pet beds, blankets, and mats', 'bed', 6)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_active ON shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_sku ON shop_products(sku);
CREATE INDEX IF NOT EXISTS idx_shop_products_stock ON shop_products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_grouped_product_items_grouped_id ON grouped_product_items(grouped_product_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grouped_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE grouped_product_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Shop Products Policies
-- Admin users can do everything
CREATE POLICY "Admin full access to shop_products" ON shop_products
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Public read access for active products (for customer marketplace)
CREATE POLICY "Public read access to active products" ON shop_products
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Product Variations Policies
CREATE POLICY "Admin full access to product_variations" ON product_variations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Public read access to product_variations" ON product_variations
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Product Attributes Policies
CREATE POLICY "Admin full access to product_attributes" ON product_attributes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Public read access to product_attributes" ON product_attributes
    FOR SELECT
    TO authenticated
    USING (true);

-- Grouped Products Policies
CREATE POLICY "Admin full access to grouped_products" ON grouped_products
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Public read access to active grouped_products" ON grouped_products
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Grouped Product Items Policies
CREATE POLICY "Admin full access to grouped_product_items" ON grouped_product_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Public read access to grouped_product_items" ON grouped_product_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Product Categories Policies
CREATE POLICY "Admin full access to product_categories" ON product_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Public read access to product_categories" ON product_categories
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_shop_products_updated_at ON shop_products;
CREATE TRIGGER update_shop_products_updated_at
    BEFORE UPDATE ON shop_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variations_updated_at ON product_variations;
CREATE TRIGGER update_product_variations_updated_at
    BEFORE UPDATE ON product_variations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grouped_products_updated_at ON grouped_products;
CREATE TRIGGER update_grouped_products_updated_at
    BEFORE UPDATE ON grouped_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment below to insert sample products for testing

/*
INSERT INTO shop_products (name, description, category, base_price, stock_quantity, sku, main_image) VALUES
    ('Heavy Duty Retractable Leash', 'Durable retractable leash for dogs up to 50lbs', 'Accessories', 24.99, 12, 'DOG-LEASH-01', 'https://example.com/leash.jpg'),
    ('Organic Salmon Cat Treats', 'Natural salmon treats for cats', 'Pet Food', 8.50, 3, 'CAT-TREAT-01', 'https://example.com/treats.jpg'),
    ('Orthopedic Dog Bed - Large', 'Memory foam bed for large dogs', 'Bedding', 89.99, 0, 'DOG-BED-L-01', 'https://example.com/bed.jpg'),
    ('Premium Oatmeal Shampoo', 'Gentle oatmeal shampoo for sensitive skin', 'Grooming', 12.50, 28, 'GROOM-SHAMP-01', 'https://example.com/shampoo.jpg'),
    ('Interactive Laser Pointer', 'Battery-powered laser toy for cats', 'Toys', 15.00, 45, 'CAT-TOY-01', 'https://example.com/laser.jpg');

-- Sample variations for the leash
INSERT INTO product_variations (product_id, variation_name, variation_value, price_adjustment, stock_quantity, sku)
SELECT id, 'Color', 'Red', 0, 5, 'DOG-LEASH-01-RED' FROM shop_products WHERE sku = 'DOG-LEASH-01'
UNION ALL
SELECT id, 'Color', 'Blue', 0, 7, 'DOG-LEASH-01-BLUE' FROM shop_products WHERE sku = 'DOG-LEASH-01';

-- Sample attributes
INSERT INTO product_attributes (product_id, attribute_name, attribute_values)
SELECT id, 'Color', ARRAY['Red', 'Blue', 'Black'] FROM shop_products WHERE sku = 'DOG-LEASH-01';
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify tables were created successfully:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%product%';
-- SELECT * FROM product_categories;
