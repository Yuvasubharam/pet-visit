# Grooming Services - Backend Migration Guide

This guide will help you set up the grooming services backend with dynamic data from Supabase.

## Overview

The grooming services system is already fully implemented with:
- ✅ Database schema for grooming packages
- ✅ Backend API services
- ✅ Frontend integration with map and location
- ✅ Booking creation and display

## What You Need to Do

### Step 1: Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

This will install:
- `tsx` - TypeScript execution for scripts
- `dotenv` - Environment variable management
- All other existing dependencies

### Step 2: Run Database Migration

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://app.supabase.com/project/kfnsqbgwqltbltngwbdh
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/003_create_grooming_bookings.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

#### Option B: Using Supabase CLI (If installed)

```bash
supabase migration up
```

### Step 3: Verify and Setup Grooming Packages

After running the migration, verify the setup:

```bash
npm run setup-grooming
```

This script will:
- ✅ Check if the `grooming_packages` table exists
- ✅ Verify grooming columns exist in the `bookings` table
- ✅ Insert default grooming packages if none exist
- ✅ Display all existing packages

**Expected Output:**
```
🚀 Setting up grooming packages...

1️⃣ Checking if grooming_packages table exists...
✅ grooming_packages table exists

2️⃣ Checking existing packages...
✅ Found 3 existing packages:

   📦 Standard Bath (basic)
      💰 Price: ₹40
      ⏱️  Duration: 45 minutes
      📝 Deep cleaning, drying, nail clipping & ear hygiene.

   📦 Full Styling (full)
      💰 Price: ₹65
      ⏱️  Duration: 90 minutes
      📝 Bath + Professional haircut, trimming & scenting.

   📦 Spa Day (luxury)
      💰 Price: ₹90
      ⏱️  Duration: 120 minutes
      📝 Full Styling + Paw massage, facial & organic treats.

3️⃣ Checking bookings table for grooming columns...
✅ Bookings table has grooming columns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Grooming setup complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Start the Application

```bash
npm run dev
```

## Database Schema

### `grooming_packages` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Package name (e.g., "Standard Bath") |
| `description` | TEXT | Package description |
| `price` | DECIMAL(10,2) | Package price in rupees |
| `package_type` | VARCHAR(50) | Package type: 'basic', 'full', or 'luxury' |
| `duration_minutes` | INTEGER | Estimated duration in minutes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `bookings` Table (Extended)

New columns added for grooming:
- `package_type` - Type of grooming package selected
- `contact_number` - Contact number for the booking
- `grooming_package_id` - Foreign key to `grooming_packages` table
- `service_type` - Set to 'grooming' for grooming bookings

## API Services

The grooming services are available in `services/api.ts`:

### `groomingService.getPackages()`
Fetches all available grooming packages ordered by price.

```typescript
const packages = await groomingService.getPackages();
```

### `groomingService.getPackageById(packageId)`
Fetches a specific package by ID.

```typescript
const package = await groomingService.getPackageById('uuid-here');
```

### `groomingService.createGroomingBooking(bookingData)`
Creates a new grooming booking.

```typescript
const booking = await groomingService.createGroomingBooking({
  userId: 'user-uuid',
  petId: 'pet-uuid',
  packageType: 'full',
  packageId: 'package-uuid',
  location: 'home', // or 'clinic'
  contactNumber: '+1234567890',
  date: '2025-12-29',
  time: '10:00',
  addressId: 'address-uuid', // Required for home visits
  paymentAmount: 65.00
});
```

### `groomingService.getUserGroomingBookings(userId)`
Fetches all grooming bookings for a user with joined data.

```typescript
const bookings = await groomingService.getUserGroomingBookings('user-uuid');
```

## Features Implemented

### 1. Grooming Page (`pages/Grooming.tsx`)
- ✅ Dynamic package loading from database
- ✅ Map integration for home visits with OpenStreetMap
- ✅ Address selection and management
- ✅ Pet selection
- ✅ Contact number input
- ✅ Location toggle (Home/Clinic)
- ✅ Real-time price calculation
- ✅ Booking creation with validation

### 2. Bookings Overview (`pages/BookingsOverview.tsx`)
- ✅ Fetches grooming bookings from database
- ✅ Displays grooming-specific icons (scissors)
- ✅ Shows package names and details
- ✅ Filters by status (Current/Past)
- ✅ Click to view booking details

### 3. Booking Details (`pages/BookingDetails.tsx`)
- ✅ Displays grooming package information
- ✅ Shows contact number
- ✅ Renders map for home visits
- ✅ Payment status and amount
- ✅ Pet information

## Testing the Flow

1. **Start the app**: `npm run dev`
2. **Login** with your credentials
3. **Navigate to Home** → Click "Grooming" service card
4. **Select a pet** from your pets list
5. **Choose location**: Home or Clinic
6. **For home visits**:
   - Map will display with your address
   - Click edit to change address
   - Add new address if needed
7. **Enter contact number**
8. **Select a package**: Basic, Full, or Luxury
9. **Click "Confirm Booking"**
10. **Navigate to "My Bookings"** to see your grooming booking
11. **Click on the booking** to view full details

## Troubleshooting

### Error: "grooming_packages table does not exist"
**Solution**: Run the migration in Supabase dashboard (Step 2)

### Error: "No packages found"
**Solution**: Run `npm run setup-grooming` to insert default packages

### Error: "Failed to create booking"
**Possible causes**:
1. User not logged in
2. No pet selected
3. Missing contact number
4. Missing address for home visits

**Check console logs** for detailed error messages

### Packages not loading in UI
**Check**:
1. Open browser console for errors
2. Verify packages exist: `npm run setup-grooming`
3. Check Supabase RLS policies allow read access

## Adding Custom Grooming Packages

You can add more packages directly in Supabase:

1. Go to Supabase dashboard
2. Navigate to **Table Editor**
3. Select `grooming_packages` table
4. Click **Insert row**
5. Fill in:
   - `name`: Package name
   - `description`: Detailed description
   - `price`: Price in rupees
   - `package_type`: 'basic', 'full', or 'luxury'
   - `duration_minutes`: Estimated duration

The new package will automatically appear in the app!

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Authenticated users can read grooming packages
- ✅ Users can only create bookings for themselves
- ✅ Users can only view their own bookings

## Next Steps

Consider adding:
- [ ] Admin panel to manage packages
- [ ] Package availability by location
- [ ] Seasonal pricing
- [ ] Discounts and promotions
- [ ] Booking modifications/cancellations
- [ ] Email/SMS notifications
- [ ] Payment gateway integration
- [ ] Groomer assignment system
- [ ] Booking ratings and reviews

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Supabase connection in `.env` file
3. Ensure migrations have been run
4. Run `npm run setup-grooming` to verify setup
