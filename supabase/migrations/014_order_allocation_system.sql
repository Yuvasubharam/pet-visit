-- =====================================================
-- Order Allocation System
-- =====================================================
-- Allocates orders to sellers (stores/doctors) who have the products
-- Enables multi-seller order fulfillment

-- =====================================================
-- STEP 1: Update orders table to track seller allocation
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS allocation_status TEXT DEFAULT 'pending' CHECK (allocation_status IN ('pending', 'allocated', 'partially_allocated', 'failed'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS allocated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_allocation_status ON orders(allocation_status);

-- =====================================================
-- STEP 2: Update order_items to track seller fulfillment
-- =====================================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS allocated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment_status ON order_items(fulfillment_status);

-- =====================================================
-- STEP 3: Create order_seller_allocations table (audit trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS order_seller_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Allocation details
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  allocated_price DECIMAL(10, 2) NOT NULL,
  
  -- Seller details at time of allocation
  seller_price DECIMAL(10, 2),
  seller_available_stock INTEGER,
  
  -- Timestamps
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  allocation_reason TEXT,
  notes TEXT,
  
  CONSTRAINT order_seller_allocations_unique UNIQUE (order_item_id, seller_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_seller_allocations_order_id ON order_seller_allocations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_seller_allocations_seller_id ON order_seller_allocations(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_seller_allocations_product_id ON order_seller_allocations(product_id);
CREATE INDEX IF NOT EXISTS idx_order_seller_allocations_allocated_at ON order_seller_allocations(allocated_at);

-- =====================================================
-- STEP 4: RLS Policies
-- =====================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_seller_allocations ENABLE ROW LEVEL SECURITY;

-- Order items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Sellers can view order items allocated to them
DROP POLICY IF EXISTS "Sellers can view allocated order items" ON order_items;
CREATE POLICY "Sellers can view allocated order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Admins can manage all order items
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items"
  ON order_items
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

-- Order seller allocations policies
DROP POLICY IF EXISTS "Users can view own order allocations" ON order_seller_allocations;
CREATE POLICY "Users can view own order allocations"
  ON order_seller_allocations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_seller_allocations.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sellers can view own allocations" ON order_seller_allocations;
CREATE POLICY "Sellers can view own allocations"
  ON order_seller_allocations
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage allocations" ON order_seller_allocations;
CREATE POLICY "Admins manage allocations"
  ON order_seller_allocations
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

-- =====================================================
-- STEP 5: Trigger to auto-update order allocation status
-- =====================================================

CREATE OR REPLACE FUNCTION update_order_allocation_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders SET 
    allocation_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM order_items 
        WHERE order_items.order_id = NEW.order_id 
        AND order_items.seller_id IS NULL
      ) THEN 'partially_allocated'::text
      ELSE 'allocated'::text
    END,
    allocated_at = NOW()
  WHERE orders.id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_allocation_status ON order_items;
CREATE TRIGGER trigger_update_order_allocation_status
  AFTER UPDATE ON order_items
  FOR EACH ROW
  WHEN (NEW.seller_id IS NOT NULL AND OLD.seller_id IS NULL)
  EXECUTE FUNCTION update_order_allocation_status();

-- =====================================================
-- STEP 6: Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Created order allocation system';
  RAISE NOTICE '✓ Updated order_items with seller_id and fulfillment_status';
  RAISE NOTICE '✓ Created order_seller_allocations for audit trail';
  RAISE NOTICE '✓ Configured RLS policies for order allocation';
  RAISE NOTICE '✓ Order allocation system ready!';
END
$$;
