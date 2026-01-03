# Prescription Products Implementation Guide

## Overview
This guide covers the implementation of prescription storage and product recommendations feature for doctors. Doctors can now:
1. Upload prescriptions (PDF/images)
2. Recommend products to pet owners
3. Search and filter products by category
4. Manage product recommendations

---

## Setup Instructions

### Step 1: Run Database Migrations

Execute the following SQL files in your Supabase SQL Editor in order:

#### 1. Fix Doctor Data Access (if not done already)
**File:** `FIX_DOCTOR_BOOKING_DATA_ACCESS.sql`

This allows doctors to see pet and user information for their bookings.

```sql
-- Copy and paste the entire content from FIX_DOCTOR_BOOKING_DATA_ACCESS.sql
-- This creates RLS policies for doctors to access booking-related data
```

#### 2. Setup Prescription Storage & Products Table
**File:** `FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql`

This creates:
- Prescriptions storage bucket
- RLS policies for prescription uploads
- `prescription_products` table for product recommendations

```sql
-- Copy and paste the entire content from FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql
```

---

## Features Implemented

### 1. Prescription Upload (Fixed)
- **Issue Fixed:** Created the missing `prescriptions` storage bucket
- **Supported formats:** PDF, JPG, PNG, JPEG
- **File size limit:** 10MB
- **Access control:** Doctors can upload, users can view their own prescriptions

### 2. Product Recommendations
Doctors can now recommend products directly from the consultation details page.

#### Components Added:
- **Search bar:** Search products by name, brand, or category
- **Category filters:** Filter by food, toys, care, medicine, or view all
- **Product grid:** Browse and add products to prescription
- **Recommended products list:** View and manage recommended products

#### User Flow:
1. Doctor opens consultation details
2. Clicks "Add Products" in the "Recommended Products" section
3. Searches or filters products
4. Clicks "Add" on desired products
5. Products appear in the recommended list
6. Can remove products by clicking the delete icon

---

## Database Schema

### New Table: `prescription_products`

```sql
CREATE TABLE prescription_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  dosage_instructions TEXT,
  duration_days INTEGER,
  notes TEXT,
  UNIQUE(booking_id, product_id)
);
```

### Key Features:
- Links prescriptions to bookings
- Tracks which doctor recommended which products
- Prevents duplicate product recommendations
- Supports quantity, dosage instructions, and duration
- Cascades on deletion for data integrity

---

## API Services Added

### `prescriptionProductService` (in `services/doctorApi.ts`)

#### Methods:

1. **`addProductToPrescription(data)`**
   - Adds a product to a prescription
   - Parameters: booking_id, doctor_id, product_id, quantity, dosage_instructions, duration_days, notes
   - Returns: Created prescription product with product details

2. **`getPrescriptionProducts(bookingId)`**
   - Fetches all products recommended for a booking
   - Returns: Array of prescription products with product details

3. **`updatePrescriptionProduct(id, updates)`**
   - Updates quantity, dosage, or notes for a recommended product
   - Returns: Updated prescription product

4. **`removeProductFromPrescription(id)`**
   - Removes a product from prescription recommendations
   - Returns: Success/error

5. **`getProducts(filters)`**
   - Searches products with optional search query and category filter
   - Returns: Array of products (max 50)

---

## Component Updates

### `DoctorConsultationDetails.tsx`

#### New Props:
- `doctorId: string | null` - Required for creating prescription products

#### New State Variables:
```typescript
const [showProductSelection, setShowProductSelection] = useState(false);
const [products, setProducts] = useState<Product[]>([]);
const [prescriptionProducts, setPrescriptionProducts] = useState<PrescriptionProduct[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [loadingProducts, setLoadingProducts] = useState(false);
const [addingProduct, setAddingProduct] = useState<string | null>(null);
```

#### New Functions:
- `loadPrescriptionProducts()` - Loads recommended products for current booking
- `loadProducts()` - Loads products based on search/filter
- `handleAddProduct(product)` - Adds product to prescription
- `handleRemoveProduct(id)` - Removes product from prescription

---

## Usage Guide for Doctors

### How to Recommend Products:

1. **Navigate to Consultation Details**
   - Click on any booking from the consultations list

2. **Add Products Section**
   - Scroll to "Recommended Products" section
   - Click "Add Products" button

3. **Search for Products**
   - Use search bar to find products by name/brand
   - OR click category buttons (Food, Toys, Care, Medicine)

4. **Add Products**
   - Click "Add" button on desired products
   - Product appears in recommended list
   - Button changes to "✓ Added" (disabled)

5. **Manage Products**
   - View all recommended products in the list
   - Click delete icon to remove any product
   - Confirmation prompt appears before removal

6. **Complete Consultation**
   - Products are saved automatically
   - Pet owners can view recommended products
   - Products can be easily added to cart for purchase

---

## Security & Access Control

### Row Level Security (RLS) Policies:

#### Prescription Storage:
- ✅ Doctors can upload prescriptions for their bookings
- ✅ Users can view their own prescriptions
- ✅ Doctors can view prescriptions they uploaded

#### Prescription Products Table:
- ✅ Doctors can insert products for their bookings
- ✅ Doctors can view/update/delete their product recommendations
- ✅ Users can view products recommended for their bookings
- ❌ Users cannot modify doctor recommendations
- ❌ Doctors cannot access other doctors' recommendations

---

## Testing Checklist

### Prescription Upload:
- [ ] Upload PDF prescription
- [ ] Upload image prescription (JPG/PNG)
- [ ] Verify file size limit (10MB max)
- [ ] Check "View Prescription" link works
- [ ] Verify prescription appears for pet owner

### Product Recommendations:
- [ ] Search products by name
- [ ] Filter products by category
- [ ] Add product to prescription
- [ ] Verify product appears in recommended list
- [ ] Remove product from prescription
- [ ] Add multiple products
- [ ] Verify duplicate prevention (can't add same product twice)
- [ ] Check loading states
- [ ] Verify empty states (no products found)

### Access Control:
- [ ] Doctor can only see their own bookings
- [ ] Doctor can only add products to their bookings
- [ ] Pet owner can view recommended products
- [ ] Pet owner cannot modify recommendations

---

## Future Enhancements (Optional)

1. **Dosage Instructions**
   - Add UI for entering dosage instructions per product
   - Display dosage info to pet owners

2. **Quick Add to Cart**
   - Allow pet owners to add all recommended products to cart with one click
   - Show total price of recommendations

3. **Product Notes**
   - Add doctor's notes for each product (e.g., "Use twice daily")
   - Display in pet owner's view

4. **Quantity Control**
   - Allow doctors to specify quantity for each product
   - Update price calculation based on quantity

5. **Product Categories**
   - Add more specific categories (supplements, grooming, etc.)
   - Multi-select category filters

6. **Prescription Templates**
   - Save common product combinations
   - Quick apply templates to new prescriptions

---

## Troubleshooting

### Prescription Upload Fails
**Error:** "Bucket not found"
**Solution:** Run `FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql` in Supabase SQL Editor

### Can't See Pet/Owner Information
**Error:** Pet shows as "Unknown Pet", owner as "Unknown"
**Solution:** Run `FIX_DOCTOR_BOOKING_DATA_ACCESS.sql` in Supabase SQL Editor

### Products Not Loading
**Check:**
1. Products exist in the `products` table
2. RLS policies allow reading products (should be public)
3. Console for error messages
4. Network tab for failed requests

### Can't Add Products
**Check:**
1. Doctor is logged in (`doctorId` is not null)
2. Booking exists and belongs to doctor
3. Product hasn't already been added (unique constraint)
4. RLS policies allow insert on `prescription_products`

---

## API Endpoints Reference

All endpoints use Supabase client (`supabase` from `lib/supabase`)

### Prescription Products:
- `POST /prescription_products` - Add product to prescription
- `GET /prescription_products?booking_id=<id>` - Get products for booking
- `PATCH /prescription_products?id=<id>` - Update product details
- `DELETE /prescription_products?id=<id>` - Remove product

### Products:
- `GET /products?name.ilike=<search>` - Search products
- `GET /products?main_category=<category>` - Filter by category

---

## Files Modified

1. ✅ `types.ts` - Added `PrescriptionProduct` interface
2. ✅ `services/doctorApi.ts` - Added `prescriptionProductService`
3. ✅ `pages/DoctorConsultationDetails.tsx` - Added product selection UI
4. ✅ `App.tsx` - Updated to pass `doctorId` prop
5. ✅ `FIX_DOCTOR_BOOKING_DATA_ACCESS.sql` - RLS policies for doctor access
6. ✅ `FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql` - Storage bucket & table setup

---

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify all SQL migrations have been run
3. Check Supabase dashboard for RLS policies
4. Verify storage bucket exists and is public
5. Review this guide's troubleshooting section

Happy prescribing! 🏥🐾
