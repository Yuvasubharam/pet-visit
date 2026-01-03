# Grooming Booking Backend Setup Guide

This guide explains how the grooming booking system has been set up and how to use it.

## 🗄️ Database Structure

### Tables Created

#### 1. **grooming_packages** Table
Stores available grooming service packages.

```sql
CREATE TABLE grooming_packages (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  package_type VARCHAR(50) NOT NULL, -- 'basic', 'full', 'luxury'
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Packages:**
- **Standard Bath** (₹40) - Deep cleaning, drying, nail clipping & ear hygiene
- **Full Styling** (₹65) - Bath + Professional haircut, trimming & scenting
- **Spa Day** (₹90) - Full Styling + Paw massage, facial & organic treats

#### 2. **bookings** Table (Extended)
The existing bookings table has been extended with grooming-specific columns:

```sql
ALTER TABLE bookings ADD COLUMN:
- package_type VARCHAR(50) -- Type of package selected
- contact_number VARCHAR(20) -- Contact number for the booking
- grooming_package_id UUID -- Foreign key to grooming_packages
```

### Indexes Added
- `idx_bookings_service_type` - For filtering by service type
- `idx_bookings_user_date` - For querying user bookings by date
- `idx_bookings_status` - For filtering by booking status

---

## 🔌 API Services

### New Service: `groomingService`

Located in: `services/api.ts`

#### Methods:

1. **getPackages()**
   - Fetches all available grooming packages
   - Returns packages sorted by price
   ```typescript
   const packages = await groomingService.getPackages();
   ```

2. **getPackageById(packageId)**
   - Fetches a specific package by ID
   ```typescript
   const package = await groomingService.getPackageById(packageId);
   ```

3. **createGroomingBooking(bookingData)**
   - Creates a new grooming booking
   - Returns the created booking with pet, address, and package details
   ```typescript
   const booking = await groomingService.createGroomingBooking({
     userId: 'user-id',
     petId: 'pet-id',
     packageType: 'full',
     packageId: 'package-uuid',
     location: 'home', // or 'clinic'
     contactNumber: '+1234567890',
     date: '2024-03-15',
     time: '10:00',
     addressId: 'address-uuid', // optional, required for home visits
     paymentAmount: 65.00
   });
   ```

4. **getUserGroomingBookings(userId)**
   - Fetches all grooming bookings for a user
   - Returns bookings with pet, address, and package details
   ```typescript
   const bookings = await groomingService.getUserGroomingBookings(userId);
   ```

---

## 📱 Frontend Integration

### Updated Components

#### **Grooming.tsx**
The grooming page has been fully connected to the backend:

**Features:**
- ✅ Loads grooming packages from database
- ✅ Displays package details dynamically
- ✅ Validates user input (pet selection, contact number, address)
- ✅ Creates bookings in the database
- ✅ Handles loading and error states
- ✅ Shows success/error messages

**Props:**
```typescript
interface Props {
  onBack: () => void;
  pets: Pet[];
  userId?: string | null;
  onBookingSuccess?: () => void; // Called after successful booking
}
```

**State Management:**
- `groomingPackages` - List of packages from database
- `selectedPet` - Currently selected pet
- `location` - 'home' or 'clinic'
- `selectedPackage` - Selected package type
- `contactNumber` - User's contact number
- `isBooking` - Loading state during booking creation

#### **App.tsx**
Updated to pass `userId` to Grooming component:
```typescript
case 'grooming': return (
  <Grooming
    onBack={() => setCurrentView('home')}
    pets={userPets}
    userId={userId}
    onBookingSuccess={() => setCurrentView('bookings-overview')}
  />
);
```

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Execute the migration file to create the necessary tables:

```bash
# Connect to your Supabase project
cd supabase

# Run the migration
supabase db push

# Or manually execute the SQL file in Supabase Dashboard:
# SQL Editor → New Query → Copy contents of migrations/003_create_grooming_bookings.sql
```

### Step 2: Verify Tables

Check that the following exist in your Supabase dashboard:

1. **Tables:**
   - `grooming_packages` (with 3 default packages)
   - `bookings` (with new columns: `package_type`, `contact_number`, `grooming_package_id`)

2. **Indexes:**
   - `idx_bookings_service_type`
   - `idx_bookings_user_date`
   - `idx_bookings_status`

3. **RLS Policies:**
   - Public read access to `grooming_packages`

### Step 3: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Grooming page:**
   - Click on "Grooming" service from the home page

3. **Test booking flow:**
   - Select a pet
   - Enter contact number
   - Choose location (Home/Clinic)
   - Select a package
   - Click "Confirm Booking"

4. **Verify in Supabase:**
   - Go to Table Editor → `bookings`
   - Check for the newly created booking
   - Verify all fields are populated correctly

---

## 🔍 Data Flow

```
User clicks "Confirm Booking"
        ↓
Frontend validates input
        ↓
groomingService.createGroomingBooking()
        ↓
Supabase INSERT into bookings table
        ↓
Returns booking with joined data (pet, address, package)
        ↓
Success message shown to user
        ↓
Navigate to bookings-overview page
```

---

## 📊 Database Queries

### Get all grooming bookings with details:
```sql
SELECT
  b.*,
  p.name as pet_name,
  p.species,
  a.full_address,
  gp.name as package_name,
  gp.price
FROM bookings b
LEFT JOIN pets p ON b.pet_id = p.id
LEFT JOIN addresses a ON b.address_id = a.id
LEFT JOIN grooming_packages gp ON b.grooming_package_id = gp.id
WHERE b.service_type = 'grooming'
  AND b.user_id = 'user-uuid'
ORDER BY b.date DESC;
```

### Get booking statistics:
```sql
SELECT
  status,
  COUNT(*) as count,
  SUM(payment_amount) as total_revenue
FROM bookings
WHERE service_type = 'grooming'
GROUP BY status;
```

---

## 🛠️ Troubleshooting

### Issue: "Failed to create booking"

**Possible causes:**
1. User not authenticated
2. Invalid pet ID
3. Missing address for home visit
4. Database RLS policies blocking insert

**Solution:**
- Check browser console for detailed error
- Verify user is logged in (`userId` is not null)
- Ensure user has added an address in their profile
- Check Supabase logs for RLS policy errors

### Issue: Packages not loading

**Possible causes:**
1. Migration not run
2. RLS policy blocking read access

**Solution:**
```sql
-- Check if packages exist
SELECT * FROM grooming_packages;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'grooming_packages';

-- Re-create RLS policy if needed
DROP POLICY IF EXISTS "Allow public read access to grooming packages" ON grooming_packages;
CREATE POLICY "Allow public read access to grooming packages"
ON grooming_packages FOR SELECT
TO authenticated
USING (true);
```

### Issue: Address not loading for home visits

**Solution:**
- User must add at least one address in their profile
- Navigate to Profile → Address Management → Add Address
- Address will be automatically selected for home visits

---

## 🎯 Future Enhancements

Potential improvements for the grooming booking system:

1. **Date & Time Selection**
   - Add calendar picker for booking date
   - Show available time slots
   - Prevent double bookings

2. **Multiple Pet Selection**
   - Allow booking grooming for multiple pets
   - Calculate total price accordingly

3. **Groomer Assignment**
   - Create `groomers` table
   - Assign specific groomer to booking
   - Show groomer profile and reviews

4. **Booking Confirmation Email/SMS**
   - Send confirmation after booking
   - Send reminder before appointment

5. **Recurring Bookings**
   - Allow users to set up recurring grooming sessions
   - Auto-create bookings for future dates

6. **Payment Integration**
   - Add payment gateway (Stripe, Razorpay)
   - Capture payment before confirming booking
   - Send payment receipt

7. **Admin Dashboard**
   - View all bookings
   - Manage groomers
   - Update package pricing
   - Generate reports

---

## 📝 Type Definitions

All TypeScript types are defined in `types.ts`:

```typescript
interface GroomingPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  package_type: 'basic' | 'full' | 'luxury';
  duration_minutes: number;
  created_at?: string;
  updated_at?: string;
}

interface Booking {
  id: string;
  user_id: string;
  pet_id: string;
  service_type: string;
  booking_type: 'online' | 'home' | 'clinic';
  package_type?: string;
  grooming_package_id?: string;
  contact_number?: string;
  date: string;
  time: string;
  address_id?: string;
  notes?: string;
  payment_amount?: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at?: string;
  pets?: Pet;
  addresses?: Address;
  grooming_packages?: GroomingPackage;
}
```

---

## ✅ Summary

The grooming booking backend is now fully integrated with:

1. ✅ Database tables created (`grooming_packages`, extended `bookings`)
2. ✅ API services implemented (`groomingService`)
3. ✅ Frontend connected (Grooming.tsx)
4. ✅ Type definitions added (types.ts)
5. ✅ Full booking flow working
6. ✅ Error handling and validation
7. ✅ Loading states and user feedback

Your grooming booking system is ready to use! 🎉
