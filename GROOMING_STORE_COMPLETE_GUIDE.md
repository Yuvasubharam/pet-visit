# Grooming Store System - Complete Implementation Guide

## 🎉 Overview

A complete grooming store management system has been implemented with the following features:

### **User Features**
- 🏠 **Home Visit Booking** - Users can book grooming services at their home
- 🏪 **Clinic Visit Booking** - Users can select from available grooming stores/clinics
- 📍 **Clinic Selection** - View all available grooming stores with addresses and prices
- 💰 **Dynamic Pricing** - Prices change based on selected clinic
- 📦 **Package Selection** - Basic, Full, and Luxury packages

### **Grooming Store Features**
- 📊 **Dashboard** - Overview of bookings, earnings, and statistics
- 📅 **Booking Management** - View and manage all grooming bookings
- ✅ **Status Updates** - Mark bookings as completed or cancelled
- 📦 **Package Management** - Add, edit, and delete grooming packages
- 🏪 **Store Settings** - Update store information and address
- 💵 **Earnings Tracking** - View total earnings and pending payouts

---

## 📁 Files Created

### **Database Schema**
- `GROOMING_STORE_SETUP.sql` - Complete database setup with tables, policies, and triggers

### **Pages**
- `pages/GroomingStoreLogin.tsx` - Grooming store login page
- `pages/GroomingStoreDashboard.tsx` - Store dashboard with stats and quick actions
- `pages/GroomingStoreBookings.tsx` - Booking management page
- `pages/GroomingStoreManagement.tsx` - Package and store settings management

### **Services**
- `services/groomingStoreApi.ts` - Complete API service for grooming stores

### **Updates**
- `pages/DoctorLogin.tsx` - Added grooming store login link
- `pages/Grooming.tsx` - Added clinic selection and dynamic pricing
- `App.tsx` - Added grooming store routes and authentication
- `types.ts` - Added grooming store view types

---

## 🚀 Setup Instructions

### **Step 1: Database Setup**

1. Open your Supabase SQL Editor
2. Run the SQL script from `GROOMING_STORE_SETUP.sql`
3. This will create:
   - `grooming_stores` table
   - `grooming_store_earnings` table
   - Row Level Security (RLS) policies
   - Triggers for automatic earnings calculation
   - Sample grooming stores

### **Step 2: Create Grooming Store Accounts**

#### **Option A: Via Supabase Dashboard**

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and password for the grooming store
4. After creating the user, note the User ID (UUID)

#### **Option B: Via SQL**

```sql
-- Create auth user first via Supabase Dashboard, then link to store
UPDATE grooming_stores
SET user_id = 'YOUR-USER-UUID-HERE'
WHERE email = 'pawsclaws@petvisit.com';
```

### **Step 3: Link Sample Stores to Auth Users**

After creating auth users, link them to grooming stores:

```sql
-- Update each store with its corresponding user_id
UPDATE grooming_stores
SET user_id = 'USER-UUID-FROM-AUTH'
WHERE email = 'pawsclaws@petvisit.com';

UPDATE grooming_stores
SET user_id = 'USER-UUID-FROM-AUTH-2'
WHERE email = 'furryfriends@petvisit.com';

UPDATE grooming_stores
SET user_id = 'USER-UUID-FROM-AUTH-3'
WHERE email = 'petparlour@petvisit.com';
```

### **Step 4: Link Packages to Stores**

```sql
-- Get store IDs
SELECT id, store_name, email FROM grooming_stores;

-- Update existing packages to belong to stores
UPDATE grooming_packages
SET grooming_store_id = (
  SELECT id FROM grooming_stores
  WHERE email = 'pawsclaws@petvisit.com'
  LIMIT 1
)
WHERE package_type IN ('basic', 'full', 'luxury');
```

### **Step 5: Test the Application**

1. Start your development server
2. Navigate to onboarding screen
3. Click "Doctor Login" → "Login as Grooming Store"
4. Use the credentials you created in Step 2

---

## 🔐 User Flow

### **For Grooming Store Owners:**

1. **Login**
   - Navigate to: Onboarding → Doctor Login → "Login as Grooming Store"
   - Enter store email and password
   - Redirected to Grooming Store Dashboard

2. **Dashboard**
   - View statistics: Total bookings, completed, upcoming, revenue
   - View earnings: Total, pending, paid out
   - Quick actions to manage bookings and packages

3. **Manage Bookings**
   - View all bookings (All / Upcoming / Completed tabs)
   - Click on booking to see full details
   - Update booking status (Mark Complete / Cancel)
   - Filter by home visits or clinic visits

4. **Manage Packages**
   - Add new grooming packages (Basic, Full, Luxury)
   - Edit existing packages (name, description, price, duration)
   - Delete packages
   - Each package has a type, price, and duration

5. **Store Settings**
   - Update store name
   - Update contact phone number
   - Update clinic address
   - Update city, state, pincode

### **For Users (Pet Owners):**

1. **Book Grooming Service**
   - Navigate to: Home → Grooming Service
   - Select pet
   - Enter contact number
   - Choose location: **Home Visit** or **Clinic Visit**

2. **Home Visit Flow**
   - Select or add delivery address
   - Choose package (Basic / Full / Luxury)
   - View price
   - Proceed to checkout

3. **Clinic Visit Flow**
   - **Select Clinic** from list of available grooming stores
   - View clinic address and contact
   - **Choose Package** - prices vary by clinic
   - View clinic-specific pricing
   - Proceed to checkout

4. **Checkout**
   - Review booking details
   - Complete payment
   - Receive confirmation

---

## 🗄️ Database Schema

### **grooming_stores**
```
- id (UUID, PK)
- store_name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- user_id (UUID, FK → auth.users) - for authentication
- address (TEXT)
- city (VARCHAR)
- state (VARCHAR)
- pincode (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- is_active (BOOLEAN)
- created_at, updated_at
```

### **grooming_packages** (updated)
```
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- price (NUMERIC)
- package_type (VARCHAR) - basic/full/luxury
- duration_minutes (INTEGER)
- grooming_store_id (UUID, FK → grooming_stores) - NEW
- created_at, updated_at
```

### **bookings** (updated)
```
- ... existing fields ...
- grooming_store_id (UUID, FK → grooming_stores) - NEW
```

### **grooming_store_earnings**
```
- id (UUID, PK)
- grooming_store_id (UUID, FK)
- booking_id (UUID, FK)
- package_amount (NUMERIC)
- platform_commission (NUMERIC) - 5% platform fee
- net_amount (NUMERIC) - 95% to store
- status (VARCHAR) - pending/paid/cancelled
- paid_at (TIMESTAMP)
- created_at
```

---

## 🔒 Security (RLS Policies)

### **grooming_stores**
- Store owners can view and update their own store
- Public can view active stores (for clinic selection)

### **grooming_packages**
- Anyone can view packages
- Store owners can manage their own packages

### **bookings**
- Stores can view and update their own bookings
- Users can view and manage their bookings

### **grooming_store_earnings**
- Stores can view their own earnings

---

## 💰 Earnings Calculation

Earnings are automatically created when a booking is marked as "completed":

- **Package Amount**: Full amount paid by user
- **Platform Commission**: 5% of package amount
- **Net Amount**: 95% of package amount (goes to store)

**Trigger**: `trigger_create_grooming_store_earnings`
- Fires after booking status changes to "completed"
- Only for grooming service bookings
- Creates earning record automatically

---

## 📊 API Endpoints (Services)

### **groomingStoreAuthService**
- `signInWithEmail(email, password)` - Login
- `signOut()` - Logout
- `getCurrentUser()` - Get current user
- `getGroomingStoreProfile(userId)` - Get store profile
- `createGroomingStoreProfile(userId, storeData)` - Create profile
- `updateGroomingStoreProfile(storeId, updates)` - Update profile

### **groomingStoreBookingService**
- `getStoreBookings(storeId, filters)` - Get all bookings
- `getBookingById(bookingId)` - Get booking details
- `updateBookingStatus(bookingId, status)` - Update status
- `getBookingStats(storeId)` - Get booking statistics

### **groomingStorePackageService**
- `getStorePackages(storeId)` - Get store packages
- `getAllActiveStores()` - Get all active stores (for clinic selection)
- `getStorePackagesByStoreId(storeId)` - Get packages for specific store
- `createPackage(storeId, packageData)` - Create new package
- `updatePackage(packageId, updates)` - Update package
- `deletePackage(packageId)` - Delete package

### **groomingStoreEarningsService**
- `getStoreEarnings(storeId, filters)` - Get earnings history
- `getEarningsStats(storeId)` - Get earnings statistics

---

## 🧪 Testing Guide

### **Test 1: Create a Grooming Store Account**
1. Create auth user in Supabase Dashboard
2. Link user_id to grooming_stores table
3. Login via app with store credentials
4. Verify dashboard loads with store name

### **Test 2: Add Grooming Packages**
1. Login as grooming store
2. Navigate to Store Management → Packages tab
3. Click "Add New Package"
4. Fill in details (name, price, type, duration)
5. Verify package appears in list

### **Test 3: User Books Clinic Visit**
1. Login as regular user
2. Navigate to Grooming service
3. Select "Clinic Visit"
4. Verify store list appears
5. Select a store
6. Verify packages update with store-specific prices
7. Complete booking

### **Test 4: Store Manages Booking**
1. Login as grooming store
2. Navigate to Bookings
3. Verify new booking appears
4. Click on booking to view details
5. Mark as "Completed"
6. Verify status updates

### **Test 5: Earnings Generation**
1. Complete a booking (mark as completed)
2. Navigate to Dashboard
3. Verify earnings stats update
4. Check database: `SELECT * FROM grooming_store_earnings;`
5. Verify 95% goes to store, 5% platform commission

---

## 🛣️ Application Routes

### **Grooming Store Routes**
- `/grooming-store-login` - Login page
- `/grooming-store-dashboard` - Dashboard
- `/grooming-store-bookings` - Booking management
- `/grooming-store-management` - Package & store settings

### **Navigation Flow**
```
Onboarding
  → Doctor Login
    → "Login as Grooming Store" button
      → Grooming Store Login
        → Grooming Store Dashboard
          → Bookings / Packages / Settings
```

---

## 📝 Sample Grooming Stores

Three sample stores are created in the SQL setup:

1. **Paws & Claws Grooming**
   - Email: `pawsclaws@petvisit.com`
   - Location: Bangalore, Karnataka
   - Phone: +91-9876543210

2. **Furry Friends Spa**
   - Email: `furryfriends@petvisit.com`
   - Location: Mumbai, Maharashtra
   - Phone: +91-9876543211

3. **The Pet Parlour**
   - Email: `petparlour@petvisit.com`
   - Location: Delhi, Delhi
   - Phone: +91-9876543212

---

## 🔧 Troubleshooting

### **Store login fails**
- Verify user exists in `auth.users`
- Verify `user_id` is linked in `grooming_stores` table
- Check RLS policies are enabled

### **No clinics appear in user app**
- Verify stores have `is_active = true`
- Check RLS policy allows public read access
- Verify `getAllActiveStores()` is being called

### **Packages don't show for clinic**
- Verify packages have `grooming_store_id` set
- Check store ID matches
- Verify RLS policies allow package read

### **Earnings not generated**
- Verify booking status is "completed"
- Verify booking has `grooming_store_id`
- Check trigger function exists and is enabled
- Verify service_type is "grooming"

---

## 🎨 Features Summary

### ✅ **Completed Features**

1. **Database Schema**
   - Grooming stores table
   - Store earnings tracking
   - RLS policies for security
   - Automatic triggers

2. **Grooming Store Portal**
   - Login/authentication
   - Dashboard with statistics
   - Booking management
   - Package management
   - Store settings

3. **User Booking Flow**
   - Clinic selection
   - Dynamic pricing per clinic
   - Package selection
   - Checkout integration

4. **Navigation & Routes**
   - All routes configured
   - Authentication guards
   - Proper state management

---

## 🚀 Next Steps (Optional Enhancements)

1. **Analytics Dashboard**
   - Revenue charts by date
   - Popular packages
   - Peak booking times

2. **Calendar Integration**
   - Availability management
   - Slot booking system

3. **Notifications**
   - Email/SMS for new bookings
   - Reminders for upcoming appointments

4. **Reviews & Ratings**
   - Customer reviews per store
   - Store ratings

5. **Multi-Image Upload**
   - Store gallery
   - Before/after photos

6. **Advanced Filtering**
   - Filter stores by distance
   - Filter by price range
   - Filter by ratings

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the SQL setup file
3. Verify RLS policies
4. Check browser console for errors
5. Review Supabase logs

---

## 🎉 Congratulations!

You now have a fully functional grooming store management system with:
- Separate login portal for grooming stores
- Complete booking management
- Dynamic clinic selection for users
- Earnings tracking
- Package management

**Happy grooming! 🐕🐈**
