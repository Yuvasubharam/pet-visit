# Real-Time Analytics Setup Guide

This guide explains how to set up real-time analytics for the Doctor Dashboard.

## 🎯 What Was Updated

### 1. Database Migration (`011_realtime_analytics.sql`)
Created a comprehensive migration that includes:
- **`doctor_analytics` view**: Aggregates real-time statistics from bookings and earnings
- **`get_doctor_analytics()` function**: RPC function to fetch analytics for a specific doctor
- **`calculate_earnings_growth()` function**: Calculates month-over-month earnings growth percentage
- **Real-time triggers**: Automatically update stats when bookings change
- **Optimized indexes**: For fast query performance

### 2. DoctorDashboard Component
Enhanced the dashboard to display comprehensive real-time analytics:
- **Today's Total**: Shows today's consultations with breakdown (completed/upcoming)
- **This Week**: Consultations for the current week
- **All Time Total**: Total consultations ever
- **Rating**: Average patient rating
- **Total Earnings**: With growth percentage and pending/paid breakdown

## 🚀 How to Apply the Migration

### Step 1: Apply the Migration to Supabase

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/011_realtime_analytics.sql`
4. Copy the entire content
5. Paste it into the SQL Editor
6. Click **Run** to execute

#### Option B: Via Supabase CLI
```bash
# Navigate to your project directory
cd "c:\Users\dimpl\Downloads\pet-visit (1)"

# Run the migration
npx supabase db push
```

### Step 2: Verify the Migration

Run this query in the SQL Editor to verify everything was created:

```sql
-- Check if the view exists
SELECT * FROM doctor_analytics LIMIT 1;

-- Check if the functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_doctor_analytics', 'calculate_earnings_growth');

-- Check if indexes were created
SELECT indexname FROM pg_indexes WHERE tablename = 'bookings' AND indexname LIKE 'idx_bookings%';
```

### Step 3: Test the Analytics

Test the RPC functions with a doctor ID:

```sql
-- Replace 'YOUR_DOCTOR_ID' with an actual doctor UUID
SELECT * FROM get_doctor_analytics('YOUR_DOCTOR_ID');

-- Test earnings growth
SELECT calculate_earnings_growth('YOUR_DOCTOR_ID');
```

## 📊 Analytics Data Provided

The dashboard now displays:

| Metric | Description | Source |
|--------|-------------|--------|
| **Today's Total** | Total consultations today | Real-time from bookings table |
| **Today Completed** | Completed consultations today | Real-time from bookings table |
| **Today Upcoming** | Upcoming consultations today | Real-time from bookings table |
| **This Week** | Consultations this week | Real-time from bookings table |
| **All Time Total** | Total consultations ever | Real-time from bookings table |
| **Rating** | Average patient rating | Real-time from doctor_reviews table |
| **Total Earnings** | Total net earnings | Real-time from doctor_earnings table |
| **Earnings Growth** | Month-over-month growth % | Calculated from doctor_earnings |
| **Pending Earnings** | Earnings awaiting payment | Real-time from doctor_earnings table |
| **Paid Earnings** | Earnings already paid | Real-time from doctor_earnings table |

## 🔄 Real-Time Updates

The analytics automatically update in real-time when:

1. **New booking is created** → Today's stats update
2. **Booking status changes** (e.g., upcoming → completed) → Stats recalculate
3. **New review is added** → Rating updates
4. **Earnings are recorded** → Earnings stats update
5. **Doctor accepts/rejects booking** → Pending requests update

## 🧪 Testing the Real-Time Updates

### Test 1: Create a Test Booking
```sql
-- Insert a test consultation booking
INSERT INTO bookings (
  user_id,
  pet_id,
  service_type,
  booking_type,
  date,
  time,
  status,
  doctor_id
) VALUES (
  'YOUR_USER_ID',
  'YOUR_PET_ID',
  'consultation',
  'online',
  TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
  '10:00',
  'upcoming',
  'YOUR_DOCTOR_ID'
);

-- Check if analytics updated
SELECT * FROM get_doctor_analytics('YOUR_DOCTOR_ID');
```

### Test 2: Complete a Booking
```sql
-- Update booking status to completed
UPDATE bookings
SET status = 'completed'
WHERE id = 'YOUR_BOOKING_ID';

-- Check if today_completed increased
SELECT today_completed FROM get_doctor_analytics('YOUR_DOCTOR_ID');
```

### Test 3: Add Earnings
```sql
-- Insert test earnings
INSERT INTO doctor_earnings (
  doctor_id,
  booking_id,
  gross_amount,
  platform_commission,
  net_amount,
  status
) VALUES (
  'YOUR_DOCTOR_ID',
  'YOUR_BOOKING_ID',
  500.00,
  50.00,
  450.00,
  'pending'
);

-- Check if earnings updated
SELECT total_earnings, pending_earnings FROM get_doctor_analytics('YOUR_DOCTOR_ID');
```

## 🎨 UI Components Updated

### Enhanced Analytics Cards

1. **Today's Total Card** (Blue)
   - Shows today's total consultations
   - Displays completed and upcoming counts as badges

2. **This Week Card** (Purple)
   - Shows current week's consultations

3. **All Time Total Card** (Indigo)
   - Shows total consultations ever

4. **Rating Card** (Orange)
   - Shows average rating out of 5

5. **Total Earnings Card** (Green, full width)
   - Shows total earnings
   - Displays earnings growth percentage
   - Shows pending vs paid breakdown

## 📝 Code Changes Summary

### `DoctorDashboard.tsx`
- Added new analytics state fields:
  - `today_cancelled`
  - `pending_requests`
  - `paid_earnings`
  - `pending_earnings`
- Enhanced analytics cards with more detailed breakdowns
- Added real-time data loading from `get_doctor_analytics()`

### `doctorApi.ts`
- Already implemented `getDoctorAnalytics()` function
- Already implemented `getEarningsGrowth()` function
- These functions call the database RPC functions

## 🔧 Troubleshooting

### Issue: Analytics not updating
**Solution**: Check if the trigger is enabled:
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_update_doctor_stats_realtime';
```

### Issue: Function not found
**Solution**: Verify permissions:
```sql
GRANT EXECUTE ON FUNCTION get_doctor_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_earnings_growth(UUID) TO authenticated;
```

### Issue: Slow queries
**Solution**: Check if indexes exist:
```sql
-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('bookings', 'doctor_earnings')
ORDER BY indexname;
```

## 🎯 Next Steps

1. **Apply the migration** using one of the methods above
2. **Restart your development server** to see the changes
3. **Login as a doctor** to view the updated dashboard
4. **Create test bookings** to see real-time updates
5. **Monitor performance** and adjust indexes if needed

## 📚 Additional Resources

- **Migration File**: `supabase/migrations/011_realtime_analytics.sql`
- **Component**: `pages/DoctorDashboard.tsx`
- **API Service**: `services/doctorApi.ts`

## ✅ Success Indicators

After applying the migration, you should see:
- ✅ Dashboard loads without errors
- ✅ All stat cards display correct numbers
- ✅ Earnings growth percentage shows correctly
- ✅ Stats update when bookings change
- ✅ Console logs show analytics data being fetched

---

**Note**: This migration is backward compatible and won't affect existing data. All existing bookings and earnings will be included in the analytics calculations.
