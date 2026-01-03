# 🚀 Quick Start - Grooming Store System

## 5-Minute Setup Guide

### **Step 1: Run SQL Setup (2 minutes)**

1. Open Supabase SQL Editor
2. Copy entire contents of `GROOMING_STORE_SETUP.sql`
3. Click "Run"
4. Wait for success message

**What this does:**
- Creates `grooming_stores` and `grooming_store_earnings` tables
- Sets up security policies
- Creates 3 sample stores
- Configures automatic triggers

---

### **Step 2: Create Store Login (2 minutes)**

#### **Create Auth User**
1. Go to Supabase → Authentication → Users
2. Click "Add User"
3. Email: `pawsclaws@petvisit.com`
4. Password: `YourPassword123!`
5. Click "Create User"
6. **Copy the User ID (UUID)**

#### **Link User to Store**
```sql
-- Replace YOUR-USER-UUID with the ID you copied
UPDATE grooming_stores
SET user_id = 'YOUR-USER-UUID'
WHERE email = 'pawsclaws@petvisit.com';
```

---

### **Step 3: Link Packages to Store (1 minute)**

```sql
-- Link existing packages to the store
UPDATE grooming_packages
SET grooming_store_id = (
  SELECT id FROM grooming_stores
  WHERE email = 'pawsclaws@petvisit.com'
)
WHERE grooming_store_id IS NULL;
```

---

### **Step 4: Test Login**

1. Start your app: `npm run dev`
2. Navigate to onboarding screen
3. Click "Doctor Login"
4. Click "Login as Grooming Store"
5. Enter credentials:
   - Email: `pawsclaws@petvisit.com`
   - Password: `YourPassword123!`
6. ✅ You should see the Grooming Store Dashboard!

---

## 🎯 Quick Test Scenarios

### **Test 1: Add a Package (30 seconds)**
1. Dashboard → "Manage Packages"
2. Click "Add New Package"
3. Fill in:
   - Name: "Premium Spa Package"
   - Price: 499
   - Type: Luxury
   - Duration: 90
4. Click "Add Package"
5. ✅ Package appears in list

### **Test 2: User Books at Clinic (1 minute)**
1. Logout → Login as user
2. Home → Grooming
3. Select pet
4. Enter contact number
5. Click "Clinic" tab
6. ✅ Should see "Paws & Claws Grooming" in clinic list
7. Select clinic
8. ✅ Packages should show with prices
9. Select package → Proceed to Checkout

### **Test 3: Manage Booking (30 seconds)**
1. Login as grooming store
2. Dashboard → "Manage Bookings"
3. ✅ Should see the booking you just created
4. Click on booking
5. Click "Mark Completed"
6. ✅ Booking status updates to completed

### **Test 4: Check Earnings (15 seconds)**
1. Still on Grooming Store Dashboard
2. Look at "Earnings" section
3. ✅ Total earnings should show (95% of booking amount)
4. ✅ Platform commission shows (5%)

---

## 📋 Complete User Flow

### **Grooming Store Owner:**
```
Login → Dashboard → View Stats
  ↓
Manage Bookings (View/Update Status)
  ↓
Manage Packages (Add/Edit/Delete)
  ↓
Store Settings (Update Info)
```

### **Pet Owner (User):**
```
Home → Grooming Service
  ↓
Select: Home Visit OR Clinic Visit
  ↓
IF Clinic: Select Store → See Store Packages
  ↓
IF Home: Use General Packages
  ↓
Select Package → Checkout → Confirm
```

---

## 🔍 Verify Everything Works

### **Check Database**
```sql
-- Verify store exists
SELECT * FROM grooming_stores WHERE email = 'pawsclaws@petvisit.com';

-- Verify packages linked
SELECT * FROM grooming_packages WHERE grooming_store_id IS NOT NULL;

-- Verify bookings
SELECT * FROM bookings WHERE service_type = 'grooming';

-- Verify earnings (after completing a booking)
SELECT * FROM grooming_store_earnings;
```

### **Check App**
- [ ] Store can login
- [ ] Dashboard shows stats
- [ ] Can add/edit packages
- [ ] Can view bookings
- [ ] User can see clinics
- [ ] User can book at clinic
- [ ] Prices change when clinic changes
- [ ] Store can update booking status
- [ ] Earnings generated when completed

---

## 🆘 Common Issues

### **"Store not found" on login**
```sql
-- Verify user_id is set
SELECT id, store_name, email, user_id FROM grooming_stores;

-- If user_id is NULL, update it:
UPDATE grooming_stores
SET user_id = 'YOUR-AUTH-USER-ID'
WHERE email = 'pawsclaws@petvisit.com';
```

### **No clinics showing for users**
```sql
-- Verify stores are active
UPDATE grooming_stores SET is_active = true;

-- Check RLS policies are enabled
SELECT * FROM pg_policies WHERE tablename = 'grooming_stores';
```

### **Packages not showing**
```sql
-- Link packages to store
UPDATE grooming_packages
SET grooming_store_id = (SELECT id FROM grooming_stores LIMIT 1)
WHERE grooming_store_id IS NULL;
```

---

## 📁 File Structure

```
pet-visit/
├── GROOMING_STORE_SETUP.sql          # Database setup
├── GROOMING_STORE_COMPLETE_GUIDE.md  # Detailed guide
├── QUICK_START_GROOMING_STORE.md     # This file
│
├── pages/
│   ├── GroomingStoreLogin.tsx        # Login page
│   ├── GroomingStoreDashboard.tsx    # Dashboard
│   ├── GroomingStoreBookings.tsx     # Booking mgmt
│   ├── GroomingStoreManagement.tsx   # Packages & settings
│   ├── Grooming.tsx                  # User booking (updated)
│   └── DoctorLogin.tsx               # Doctor login (updated)
│
├── services/
│   └── groomingStoreApi.ts           # API services
│
├── App.tsx                            # Routes (updated)
└── types.ts                           # Types (updated)
```

---

## 🎉 Done!

You now have:
- ✅ Grooming store login portal
- ✅ Store dashboard with stats
- ✅ Booking management
- ✅ Package management
- ✅ Clinic selection for users
- ✅ Dynamic pricing
- ✅ Earnings tracking

**Total Setup Time: ~5 minutes**

For detailed information, see `GROOMING_STORE_COMPLETE_GUIDE.md`

---

## 🔗 Quick Links

**Access Points:**
- Grooming Store Login: Onboarding → Doctor Login → "Login as Grooming Store"
- User Booking: Home → Grooming Service
- Sample Login: `pawsclaws@petvisit.com` / `YourPassword123!`

**Key Tables:**
- `grooming_stores` - Store information
- `grooming_packages` - Packages per store
- `grooming_store_earnings` - Earnings tracking
- `bookings` - All bookings (with store link)

**Need Help?**
See `GROOMING_STORE_COMPLETE_GUIDE.md` for:
- Detailed setup instructions
- API documentation
- Security policies
- Troubleshooting guide
- Feature enhancements

Happy grooming! 🐕🐈✨
