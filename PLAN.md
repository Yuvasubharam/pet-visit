# Shop Product Management Implementation Plan

## Overview
Add Shop Product Management pages to the Admin Dashboard, connecting them alongside CustomerManagement, AdminUsersManagement, and DoctorManagement.

## Pages to Create (from HTML mockups)

Based on the provided HTML mockups, we need to create 6 React pages:

1. **ShopProductInventory.tsx** - Main product list with search/filter (Shop Inventory)
2. **CreateSingleProduct.tsx** - Form to create a single product with images, attributes, variations
3. **CreateGroupedProduct.tsx** - Form to create bundled/grouped products
4. **BulkProductImport.tsx** - CSV/Excel file upload for bulk import
5. **BulkImportErrorResolution.tsx** - Fix import errors with field mapping
6. **ProductVariation.tsx** - Manage product variations (color, size, etc.)

## Implementation Steps

### Step 1: Update types.ts
Add new types for shop products in admin context:
- `ShopProduct` interface with fields: id, name, description, price, category, stock, images, attributes, variations
- `ProductVariation` interface
- `ProductAttribute` interface
- `BulkImportError` interface
- Add new AppView types for admin product pages

### Step 2: Create Admin Product API Service (in adminApi.ts)
Add `adminProductService` with methods:
- `getAllProducts(filters)` - List products with search/category/stock filters
- `getProductById(id)` - Get single product details
- `createProduct(data)` - Create single product
- `updateProduct(id, data)` - Update product
- `deleteProduct(id)` - Delete product
- `createGroupedProduct(data)` - Create bundled product
- `bulkImportProducts(file)` - Process CSV/Excel import
- `getProductStats()` - Get inventory statistics

### Step 3: Create ShopProductInventory.tsx
Main list page following CustomerManagement.tsx patterns:
- Header with back button and "Add" button
- Search bar with product/ID search
- Category filter chips (All, Dog Food, Cat Toys, Grooming, Healthcare)
- Product list cards showing: image, name, category, price, stock status
- Stock status badges: In Stock (green), Low Stock (orange), Out of Stock (red)
- Add product modal with options: Single Product, Grouped Product, Bulk Import

### Step 4: Create CreateSingleProduct.tsx
Form page with:
- Image upload section (multiple images, main image designation)
- Product name input
- Category dropdown
- Price and Stock quantity inputs
- Rich text description editor
- Attributes & Variations section
- Save button

### Step 5: Create ProductVariation.tsx
Variation management page:
- Variation name input (Color, Size, Material)
- Options tag input with add/remove
- Per-variation image, price, and stock fields
- Save Variations button

### Step 6: Create CreateGroupedProduct.tsx
Bundled product form:
- Group name and description
- Search and add existing products
- Quantity controls for each product
- Bundle summary (total products, combined price)
- Final group price with discount display

### Step 7: Create BulkProductImport.tsx
Import page with:
- Instructions section
- Download template button
- File upload area (drag & drop CSV/Excel)
- Import progress display
- Navigate to error resolution if errors found

### Step 8: Create BulkImportErrorResolution.tsx
Error fixing page:
- Field mapping section (CSV header -> System attribute)
- Auto-map button
- Scrollable error table with inline editing
- Row number, SKU, Product Name, Price columns
- Error indicators and messages
- Save Corrections & Re-import button

### Step 9: Update App.tsx
Add routing for new views:
```typescript
case 'admin-products': return <ShopProductInventory ... />
case 'admin-product-create': return <CreateSingleProduct ... />
case 'admin-product-grouped': return <CreateGroupedProduct ... />
case 'admin-product-variation': return <ProductVariation ... />
case 'admin-product-import': return <BulkProductImport ... />
case 'admin-product-import-errors': return <BulkImportErrorResolution ... />
```

### Step 10: Add Navigation from Admin Dashboard
Update CustomerManagement or create an admin navigation menu to access Shop Product Management.

## File Structure
```
pages/
  ShopProductInventory.tsx      (new)
  CreateSingleProduct.tsx       (new)
  CreateGroupedProduct.tsx      (new)
  ProductVariation.tsx          (new)
  BulkProductImport.tsx         (new)
  BulkImportErrorResolution.tsx (new)

services/
  adminApi.ts                   (update - add adminProductService)

types.ts                        (update - add product types and AppView entries)
App.tsx                         (update - add routing)
```

## UI/UX Patterns (from existing codebase)
- Mobile-first design (max-w-md mx-auto)
- Sticky headers with back navigation
- Filter chips for categories
- Card-based list items with shadows
- Material Symbols Outlined icons
- Primary color: #014b7a
- Status badges with ring borders
- Bottom sheet modals for add/edit forms
- Loading spinner states
- Empty state illustrations

## Dependencies
- Uses existing Supabase client
- Uses existing Tailwind CSS configuration
- Uses Material Symbols Outlined icons (already loaded)
