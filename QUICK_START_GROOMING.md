# 🚀 Quick Start - Grooming Services Backend Setup

## ⚡ Fast Setup (3 Steps)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Run Database Migration

**Go to Supabase Dashboard:**
1. Open: https://app.supabase.com/project/kfnsqbgwqltbltngwbdh/sql
2. Click "New Query"
3. Copy & paste: `supabase/migrations/003_create_grooming_bookings.sql`
4. Click "Run"

### 3️⃣ Verify Setup
```bash
npm run setup-grooming
```

## ✅ What Gets Set Up

- **Database Table**: `grooming_packages` with 3 default packages
- **Booking Extensions**: Grooming columns in `bookings` table
- **Default Packages**:
  - 📦 Standard Bath - ₹40 (45 min)
  - 📦 Full Styling - ₹65 (90 min)
  - 📦 Spa Day - ₹90 (120 min)

## 🎯 How It Works

### Backend (Already Implemented ✅)
- `services/api.ts` → `groomingService` with 4 methods
- Supabase integration with RLS policies
- Automatic data fetching and caching

### Frontend (Already Implemented ✅)
- **Grooming Page**: Dynamic packages, map for home visits, address selection
- **Bookings Overview**: Shows all grooming bookings with icons
- **Booking Details**: Full details with map and package info

## 🧪 Testing

1. Start app: `npm run dev`
2. Login → Home → Click "Grooming"
3. Select pet → Choose location → Enter phone → Select package
4. Click "Confirm Booking"
5. Go to "My Bookings" to see your booking

## 📊 Verify in Database

Run this SQL in Supabase to check everything:
```sql
SELECT * FROM grooming_packages;
SELECT * FROM bookings WHERE service_type = 'grooming';
```

Or use the verification script:
- File: `supabase/check_grooming_setup.sql`
- Run in: Supabase SQL Editor

## 🔧 Files Created/Modified

### New Files
- ✅ `scripts/setup-grooming.ts` - Setup verification script
- ✅ `GROOMING_MIGRATION_GUIDE.md` - Complete guide
- ✅ `QUICK_START_GROOMING.md` - This file
- ✅ `supabase/check_grooming_setup.sql` - Verification queries

### Modified Files
- ✅ `package.json` - Added setup script and dependencies
- ✅ `pages/Grooming.tsx` - Dynamic packages + map integration
- ✅ `pages/BookingsOverview.tsx` - Grooming bookings display
- ✅ `pages/BookingDetails.tsx` - Already had grooming support
- ✅ `App.tsx` - Booking state management

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| No packages showing | Run `npm run setup-grooming` |
| Table doesn't exist | Run migration in Supabase dashboard |
| Booking fails | Check console - likely missing pet/contact/address |

## 📚 Documentation

- **Full Guide**: `GROOMING_MIGRATION_GUIDE.md`
- **Backend Setup**: `GROOMING_BACKEND_SETUP.md`
- **Original Notes**: `QUICK_START.md`

---

**Everything is already implemented!** Just run the 3 setup steps above to activate the backend. 🎉
