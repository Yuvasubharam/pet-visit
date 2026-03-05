# Cart & Product Variations Fixes

## Issues Fixed

### 1. **Cart Foreign Key Constraint Error (23503)**
**Problem:** `cart_items` table had foreign key referencing `products` table which doesn't exist  
**Solution:** Created migration file `FIX_CART_ITEMS_FOREIGN_KEY.sql` that:
- Drops old FK constraint referencing `products`
- Creates new FK constraint referencing `shop_products`

**Action Required:**
1. Open Supabase SQL Editor
2. Copy and execute the contents of `FIX_CART_ITEMS_FOREIGN_KEY.sql`

---

### 2. **Cart Items Query Error (PGRST200)**
**Problem:** Cart loading query tried to join `cart_items` with `products` table  
**Files Modified:** `services/api.ts` (lines 851-863)
**Changes:**
- Changed select relationship from `products (...)` to `shop_products (...)`
- Updated field names: `name`, `base_price`, `main_image`, `category`

**Status:** ✅ Fixed

---

### 3. **Cart Rendering Issues**
**Problem:** Cart.tsx tried to access `item.products?.name`, `item.products?.price`, etc. but data now comes from `shop_products`  
**Files Modified:** `pages/Cart.tsx` (lines 71-77)
**Changes:**
- `item.products?.name` → `item.shop_products?.name`
- `item.products?.price` → `item.shop_products?.base_price`
- `item.products?.image` → `item.shop_products?.main_image`
- `item.products?.brand` → `item.shop_products?.category`

**Status:** ✅ Fixed

---

### 4. **Doctor API Products Query**
**Problem:** `doctorApi.ts` getProducts() method queried old `products` table  
**Files Modified:** `services/doctorApi.ts` (lines 877-896)
**Changes:**
- Changed table from `products` to `shop_products`
- Updated field: `main_category` → `category`
- Removed search on non-existent `brand` field

**Status:** ✅ Fixed

---

### 5. **Sale Price Support in Product Listings**
**Problem:** Sale prices weren't displayed in marketplace  
**Files Modified:** `services/api.ts`
**Changes Made:**
1. **getAllProducts()** - Added `sale_price` to select statement
2. **getProductsByCategory()** - Added `sale_price` to select statement
3. **getProduct()** - Added `sale_price` to select statement
4. **Price Mapping** - Changed all price mappings to: `price: p.sale_price || p.base_price`

**Status:** ✅ Fixed

---

### 6. **Product Variations - Sale Price Support**
**Files Modified:** 
- `services/adminApi.ts` - Added `sale_price?: number | null` parameter to `createVariation()` method
- `pages/AdminCreateProduct.tsx` - Updated variation creation/editing to pass `sale_price`

**Status:** ✅ Fixed

---

### 7. **Variation Modal - UX Improvements**
**Problem:** Sale price field was hidden, final price calculation was wrong  
**Files Modified:** `pages/AdminCreateProduct.tsx`
**Changes:**
- Added `pb-24` padding to modal form for scrollable content
- Enhanced Final Price display with strikethrough original and green sale price
- Made Save button sticky so it stays visible while scrolling

**Status:** ✅ Fixed

---

## What Still Needs to Be Done

### In Supabase:
1. **Run the migration** `FIX_CART_ITEMS_FOREIGN_KEY.sql` to fix the foreign key constraint

### Code Testing:
1. Test adding products to cart - should now work without FK errors
2. Test product variations - should load and display sale prices correctly
3. Test cart display - should show product names and prices from `shop_products` table
4. Test sale prices - marketplace should show sale price if available, otherwise base price

---

## Database Schema Summary

After these fixes, the data flow is:

```
Marketplace
  ↓
Products loaded from: shop_products
  ↓ (product.id is shop_products.id)
ProductDetail
  ↓
Variations loaded via: adminProductService.getProductById(shop_products.id)
  ↓
Add to Cart → cartService.addToCart(userId, shop_products.id, quantity)
  ↓
cart_items.product_id (FK) → shop_products.id
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `services/api.ts` | Fixed cart query, added sale_price to product fetching |
| `pages/Cart.tsx` | Updated to use shop_products field names |
| `services/doctorApi.ts` | Updated products query to use shop_products |
| `services/adminApi.ts` | Added sale_price support to variation creation |
| `pages/AdminCreateProduct.tsx` | Fixed sale_price passing, improved modal UX |
| `FIX_CART_ITEMS_FOREIGN_KEY.sql` | New migration file for FK constraint |

---

## Next Steps

1. **CRITICAL**: Run the `FIX_CART_ITEMS_FOREIGN_KEY.sql` migration in Supabase
2. Test cart functionality - add items and checkout
3. Test product variations with sale prices
4. Monitor browser console for any remaining errors
