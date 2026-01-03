# Quick Setup Guide - Prescription & Product Recommendations

## 🚀 Quick Start (3 Steps)

### Step 1: Run SQL Scripts in Supabase
Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

1. **FIX_DOCTOR_BOOKING_DATA_ACCESS.sql**
   - Fixes: Doctors can now see pet names, photos, ages, and owner info
   - Run time: ~5 seconds

2. **FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql**
   - Creates: Prescription storage bucket
   - Creates: prescription_products table
   - Sets up: All necessary permissions
   - Run time: ~10 seconds

### Step 2: Verify Setup
Check in Supabase Dashboard:
- ✅ Storage → Buckets → "prescriptions" exists
- ✅ Database → Tables → "prescription_products" exists
- ✅ Authentication → Policies → New doctor policies visible

### Step 3: Test the Features
1. Login as a doctor
2. Go to Consultations → Click on any booking
3. Try uploading a prescription (PDF or image)
4. Click "Add Products" to recommend products
5. Search/filter and add products to prescription

---

## ✨ What's New

### For Doctors:
- ✅ Upload prescription files (PDF/images)
- ✅ Search and recommend products to pet owners
- ✅ Filter products by category (Food, Toys, Care, Medicine)
- ✅ See pet photos, names, ages, and owner information
- ✅ Manage product recommendations (add/remove)

### Features:
- **Smart Search**: Find products by name, brand, or category
- **Category Filters**: Quick access to product types
- **Visual Product Cards**: See product images and prices
- **Duplicate Prevention**: Can't add same product twice
- **Real-time Updates**: Changes reflect immediately

---

## 🎯 How to Use (Doctor)

### Upload Prescription:
1. Open consultation details
2. Scroll to "Prescription" section
3. Click upload area or drag file
4. File uploads automatically
5. Link appears to view uploaded prescription

### Recommend Products:
1. Scroll to "Recommended Products" section
2. Click "Add Products" button
3. Search for products OR filter by category
4. Click "Add" on products you want to recommend
5. Products appear in the recommended list
6. Remove products by clicking delete icon

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Bucket not found" error | Run `FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql` |
| Can't see pet names/photos | Run `FIX_DOCTOR_BOOKING_DATA_ACCESS.sql` |
| Products not loading | Check products exist in database |
| Can't add products | Verify doctor is logged in |

---

## 📁 Files Created/Modified

### SQL Files (run these):
- `FIX_DOCTOR_BOOKING_DATA_ACCESS.sql`
- `FIX_PRESCRIPTION_STORAGE_AND_PRODUCTS.sql`

### Code Files (already updated):
- `types.ts` - Added PrescriptionProduct interface
- `services/doctorApi.ts` - Added prescriptionProductService
- `pages/DoctorConsultationDetails.tsx` - Added product selection UI
- `App.tsx` - Updated props

### Documentation:
- `PRESCRIPTION_PRODUCTS_IMPLEMENTATION_GUIDE.md` - Full guide
- `QUICK_SETUP_PRESCRIPTION_FEATURE.md` - This file

---

## 📊 Database Schema

```
prescription_products
├── id (UUID)
├── booking_id (UUID) → bookings.id
├── doctor_id (UUID) → doctors.id
├── product_id (UUID) → products.id
├── quantity (INTEGER)
├── dosage_instructions (TEXT)
├── duration_days (INTEGER)
├── notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🔐 Security

- ✅ Doctors can only access their own bookings
- ✅ Doctors can only recommend products for their bookings
- ✅ Users can view products recommended for their bookings
- ✅ Users cannot modify doctor recommendations
- ✅ Prescriptions are stored securely with proper access control

---

## ✅ Success Checklist

After setup, verify:
- [ ] Can upload prescription PDF
- [ ] Can upload prescription image
- [ ] Can see pet photo and name in consultations
- [ ] Can see owner name and phone
- [ ] Can click "Add Products"
- [ ] Can search for products
- [ ] Can filter by category
- [ ] Can add product to prescription
- [ ] Product appears in recommended list
- [ ] Can remove product from list
- [ ] Can't add duplicate products

---

## 🎉 You're Done!

The prescription and product recommendation feature is now fully functional. Doctors can:
- Upload prescriptions safely
- Recommend products to pet owners
- Help pet owners find the right products for their pets

For detailed documentation, see `PRESCRIPTION_PRODUCTS_IMPLEMENTATION_GUIDE.md`
