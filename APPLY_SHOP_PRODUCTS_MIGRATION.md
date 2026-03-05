# Apply Shop Products Migration

## Overview
This migration resolves the foreign key constraint error by:
1. Copying all existing products from the `products` table to `shop_products`
2. Updating `prescription_products` to reference `shop_products` instead of `products`

## Error Resolution
**Error**: `insert or update on table "prescription_products" violates foreign key constraint`
**Root Cause**: Product IDs exist in `prescription_products` but not in `shop_products`

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire content of:
   ```
   supabase/migrations/012_migrate_products_to_shop_products.sql
   ```
5. Click **Run**
6. Check the results - you should see the migration summary

### Option 2: Via Supabase CLI

```bash
supabase migration up
```

## What the Migration Does

### Step 1: Copy Products
- Takes all products from the old `products` table
- Inserts them into `shop_products` with:
  - Same ID (preserves all references)
  - Same name, description, category
  - Price → base_price
  - Stock → stock_quantity
  - Image → main_image
  - Auto-generated SKU from name + id

### Step 2: Update Foreign Key
- Removes the old FK constraint from `prescription_products`
- Creates a new FK constraint pointing to `shop_products`

### Step 3: Verification
- Confirms all prescription products have valid shop_products references
- Provides a migration summary

## After Migration

### Backwards Compatibility
The old `products` table can remain for now to keep `order_items` and `cart_items` working.

### Future Steps (Optional)
Once prescription products are fully working, you can:

1. Migrate `order_items` to reference `shop_products`
2. Migrate `cart_items` to reference `shop_products`  
3. Drop the old `products` table

## Troubleshooting

### Migration Fails
Check these in order:

1. **Ensure `shop_products` table exists**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'shop_products';
   ```

2. **Check product counts**:
   ```sql
   SELECT COUNT(*) FROM products;
   SELECT COUNT(*) FROM shop_products;
   ```

3. **Find unmatched prescription products**:
   ```sql
   SELECT pp.id, pp.product_id, pp.booking_id
   FROM prescription_products pp
   WHERE NOT EXISTS (
     SELECT 1 FROM shop_products sp WHERE sp.id = pp.product_id
   );
   ```

### FK Constraint Still Fails
If you get the FK error after running the migration:

1. Verify the migration completed successfully
2. Check that all product IDs from step 1 are now in `shop_products`
3. Run the query from "Find unmatched prescription products" above

## Rollback (if needed)

If you need to revert, run:

```sql
-- Revert FK constraint back to products table
ALTER TABLE prescription_products
DROP CONSTRAINT prescription_products_product_id_fkey;

ALTER TABLE prescription_products
ADD CONSTRAINT prescription_products_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Delete migrated products from shop_products (optional)
DELETE FROM shop_products 
WHERE id IN (SELECT DISTINCT product_id FROM prescription_products);
```

## Next Steps

Once the migration is complete, you can:

1. ✅ Test prescription product recommendations
2. ✅ Implement multi-seller product listings
3. ✅ Add approval workflow for store products
4. ✅ Migrate remaining tables (`order_items`, `cart_items`)
