# Product Filters - Migration Guide

## Overview
Added two new columns to the `products` table to enable filtering by pet type and main category in the marketplace.

## Database Changes

### New Columns Added:
1. **`pet`** - Specifies which pet type the product is for
   - Type: `text`
   - Default: `'all'`
   - Values: `'all'`, `'dog'`, `'cat'`, `'rabbits'`, `'turtles'`, `'birds'`, `'other'`

2. **`main_category`** - Main product category for filtering
   - Type: `text`
   - Default: `'food'`
   - Values: `'food'`, `'toys'`, `'care'`, `'medicine'`

### How to Apply Migration

Run the SQL migration file:
```bash
# Using Supabase CLI
supabase db push

# Or execute the SQL file directly in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/add_product_filters.sql
```

Or manually run this SQL:
```sql
-- Add pet column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pet text DEFAULT 'all';

-- Add main_category column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS main_category text DEFAULT 'food';

-- Add comments
COMMENT ON COLUMN public.products.pet IS 'Pet type: all, dog, cat, rabbits, turtles, birds, other';
COMMENT ON COLUMN public.products.main_category IS 'Main category: food, toys, care, medicine';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_pet ON public.products(pet);
CREATE INDEX IF NOT EXISTS idx_products_main_category ON public.products(main_category);
CREATE INDEX IF NOT EXISTS idx_products_pet_main_category ON public.products(pet, main_category);
```

## Frontend Changes

### TypeScript Types
Updated `Product` interface in `types.ts`:
```typescript
export interface Product {
  // ... existing fields
  pet?: 'all' | 'dog' | 'cat' | 'rabbits' | 'turtles' | 'birds' | 'other';
  main_category?: 'food' | 'toys' | 'care' | 'medicine';
}
```

### Marketplace Component
Added two filter sections:

#### 1. Pet Type Filter
- All Pets (default)
- Dogs
- Cats
- Rabbits
- Turtles
- Birds
- Others

#### 2. Main Category Filter
- All (default)
- Food (restaurant icon)
- Toys (videogame_asset icon)
- Care (spa icon)
- Medicine (medical_services icon)

## Usage

### Filtering Logic
Products are filtered using the following rules:
1. If pet type is "all", show all products
2. If a specific pet is selected, show:
   - Products with `pet = 'all'` (universal products)
   - Products with `pet = selected_pet_type`
3. Category filter works independently and can be combined with pet type filter

### Example Product Data
```sql
-- Example: Dog food
INSERT INTO products (name, brand, price, category, image, pet, main_category)
VALUES ('Premium Dog Food', 'Pedigree', 1299.99, 'Food', 'image_url', 'dog', 'food');

-- Example: Universal toy (works for all pets)
INSERT INTO products (name, brand, price, category, image, pet, main_category)
VALUES ('Squeaky Ball', 'Generic', 199.99, 'Toys', 'image_url', 'all', 'toys');

-- Example: Cat medicine
INSERT INTO products (name, brand, price, category, image, pet, main_category)
VALUES ('Flea Treatment', 'Frontline', 599.99, 'Medicine', 'image_url', 'cat', 'medicine');
```

## UI Features

### Pet Type Pills
- Horizontal scrollable row of pill-shaped buttons
- Material icons for each pet type
- Active state with primary color and shadow
- Smooth transitions

### Main Category Cards
- Larger card-style buttons
- Material icons (restaurant, toys, spa, medical)
- Active state highlighting
- Shadow effects

## Performance Optimizations

### Database Indexes
Three indexes created for optimal query performance:
1. `idx_products_pet` - Single column index on `pet`
2. `idx_products_main_category` - Single column index on `main_category`
3. `idx_products_pet_main_category` - Composite index for combined filtering

These indexes ensure fast filtering even with large product catalogs.

## Migration Checklist

- [x] Create SQL migration file
- [x] Update TypeScript types
- [x] Update Marketplace UI with pet type filter
- [x] Update Marketplace UI with category filter
- [x] Add filtering logic to loadProducts function
- [x] Create database indexes
- [ ] Run migration on Supabase
- [ ] Update existing products with appropriate pet/category values
- [ ] Test filtering functionality

## Next Steps

1. **Apply the migration** to your Supabase database
2. **Update existing products** with correct `pet` and `main_category` values
3. **Test the filters** in the marketplace
4. **Add sample products** for each pet type and category combination
