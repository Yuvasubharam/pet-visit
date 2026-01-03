# Product Filters Deployment Guide

This guide explains how to deploy the new product filtering system with sample products.

## What's New

The product filtering system adds two new columns to your products table:

1. **`pet`** - Filter products by pet type (all, dog, cat, rabbits, turtles, birds, other)
2. **`main_category`** - Filter products by category (food, toys, care, medicine)

## Quick Deploy (Recommended)

### Option A: Using Deployment Script (Windows)

Simply run the batch file:

```bash
cd scripts
deploy-product-filters.bat
```

### Option B: Using Deployment Script (Mac/Linux)

```bash
cd scripts
chmod +x deploy-product-filters.sh
./deploy-product-filters.sh
```

### Option C: Using Supabase CLI

```bash
# Apply migration
supabase db push

# Seed sample products
psql $DATABASE_URL -f supabase/seeds/002_sample_products.sql
```

## Manual Deployment

If you prefer manual deployment or the scripts don't work:

### Step 1: Apply Database Migration

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Add pet column (specifies which pet type the product is for)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pet text DEFAULT 'all';

-- Add main_category column (groups products into major categories)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS main_category text DEFAULT 'food';

-- Add comments for documentation
COMMENT ON COLUMN public.products.pet IS 'Pet type: all, dog, cat, rabbits, turtles, birds, other';
COMMENT ON COLUMN public.products.main_category IS 'Main category: food, toys, care, medicine';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_pet ON public.products(pet);
CREATE INDEX IF NOT EXISTS idx_products_main_category ON public.products(main_category);
CREATE INDEX IF NOT EXISTS idx_products_pet_main_category ON public.products(pet, main_category);

-- Update existing products to have default values if needed
UPDATE public.products
SET pet = 'all', main_category = 'food'
WHERE pet IS NULL OR main_category IS NULL;
```

### Step 2: Seed Sample Products

Copy and paste the contents of `supabase/seeds/002_sample_products.sql` into the SQL Editor and run it.

**⚠️ WARNING**: The seed file contains `TRUNCATE TABLE products` which will delete all existing products. If you want to keep existing products, comment out line 5 in the seed file before running.

## Sample Products Overview

The seed file includes **51 products** across all pet types and categories:

### Dogs (12 products)
- **Food**: Royal Canin dry food, Pedigree puppy food, Purina wet food
- **Toys**: Kong rubber toy, tennis balls, rope toy
- **Care**: Steel bowls, training pads, shampoo
- **Medicine**: Flea treatment, joint supplement, dewormer

### Cats (12 products)
- **Food**: Whiskas cat food, Royal Canin kitten food, Fancy Feast variety pack
- **Toys**: Feather wand, catnip mice, laser pointer
- **Care**: Self-cleaning litter box, scratching post, clumping litter
- **Medicine**: Flea treatment, hairball treats, liquid dewormer

### Rabbits (6 products)
- **Food**: Timothy hay, rabbit pellets
- **Toys**: Willow ball toys, tunnel play set
- **Care**: Large cage, grooming brush
- **Medicine**: Vitamin supplement

### Turtles (5 products)
- **Food**: Turtle pellets, dried shrimp treats
- **Care**: 40-gallon tank, UV basking lamp, water filter
- **Medicine**: Shell care supplement

### Birds (6 products)
- **Food**: Parakeet food mix, honey stick treats
- **Toys**: Mirror with bell, swing perch
- **Care**: Medium cage, cuttlebone pack
- **Medicine**: Vitamin drops

### Universal/All Pets (6 products)
- **Food**: Multi-pet vitamin powder
- **Toys**: Squeaky ball
- **Care**: Pet carrier, odor eliminator, waste bags
- **Medicine**: First aid kit, wound care spray

## Testing the Filters

After deployment, test the filters in your marketplace:

1. Open your app and navigate to the Marketplace
2. Try filtering by different pet types (Dogs, Cats, Rabbits, etc.)
3. Try filtering by categories (Food, Toys, Care, Medicine)
4. Combine both filters to see products for specific pet types in specific categories

### Expected Behavior

- **"All Pets"** filter: Shows universal products + all pet-specific products
- **Specific pet filter** (e.g., "Dogs"): Shows universal products + dog-specific products
- **Category filters**: Work independently and can be combined with pet filters
- Products with `pet='all'` appear in all pet type filters (they're universal)

## Customizing Products

You can customize the sample products by:

1. **Adding new products**: Insert new rows with appropriate `pet` and `main_category` values
2. **Updating existing products**: Modify the seed file before running it
3. **Using real product images**: Replace the placeholder image URLs with actual product images

Example SQL to add a new product:

```sql
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet, main_category)
VALUES (
  'Premium Fish Food',
  'TetraMin',
  'Nutritionally balanced flake food for tropical fish',
  349.99,
  'Food',
  'https://your-image-url.com/fish-food.jpg',
  150,
  4.6,
  'other',  -- for fish/other pets
  'food'
);
```

## Database Schema

After migration, your `products` table will have:

```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  description?: string;
  price: number;
  category: string;
  image: string;
  stock?: number;
  rating?: number;
  pet?: 'all' | 'dog' | 'cat' | 'rabbits' | 'turtles' | 'birds' | 'other';
  main_category?: 'food' | 'toys' | 'care' | 'medicine';
}
```

## Performance

The migration creates three indexes for optimal query performance:

1. `idx_products_pet` - Single column index
2. `idx_products_main_category` - Single column index
3. `idx_products_pet_main_category` - Composite index for combined filtering

These indexes ensure fast filtering even with thousands of products.

## Troubleshooting

### Migration fails
- Check your Supabase connection
- Ensure you have proper permissions
- Verify the products table exists

### Seed file fails
- Make sure the migration ran successfully first
- Check if you want to keep existing products (comment out TRUNCATE line)
- Verify image URLs are accessible

### Filters not working
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors
- Verify the migration added the columns: `SELECT pet, main_category FROM products LIMIT 1;`

## Next Steps

1. ✅ Deploy the migration and seed data
2. ✅ Test the filters in your marketplace
3. 🔄 Replace sample products with real products (optional)
4. 🔄 Add actual product images (optional)
5. 🔄 Adjust pricing to match your currency/market

## Support

For issues or questions, refer to:
- [PRODUCT_FILTERS_README.md](PRODUCT_FILTERS_README.md) - Detailed implementation guide
- Supabase documentation - Database migrations
- Check the browser console for frontend errors

---

**Last Updated**: 2025-12-28
