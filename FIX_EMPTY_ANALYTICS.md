# 🔧 Fix Empty Analytics Data

## 📊 Current Issue

Your Doctor Dashboard is showing:
- **Rating**: 0.0 / 5 ⭐
- **Total Earnings**: ₹0.00 💰
- **Today's Total**: 0
- **This Week**: 0
- **All Time Total**: 0

## 🔍 Root Cause

The analytics are working correctly! The data is empty because:

1. ✅ **Real-time analytics system is working** (the migration is applied)
2. ❌ **No data exists in these tables**:
   - `doctor_earnings` table is empty
   - `doctor_reviews` table is empty
   - No completed consultations with earnings

## ✅ Solutions

### Option 1: Create Test Data (RECOMMENDED for Testing)

Run this script to populate sample data:

**File**: [POPULATE_TEST_DATA.sql](POPULATE_TEST_DATA.sql)

```sql
-- Copy and paste the entire file into Supabase SQL Editor
-- It will automatically:
-- ✅ Create test bookings for today and this week
-- ✅ Create doctor earnings records
-- ✅ Create patient reviews
-- ✅ Calculate growth percentage
```

**What it creates:**
- 2 bookings today (1 completed, 1 upcoming)
- 1 booking this week
- 1 booking last month (for growth calculation)
- 3 patient reviews (4-5 stars)
- Total earnings: ₹1,215

### Option 2: Manual Data Entry (For Custom Data)

Use this if you want to insert specific data:

**File**: [INSERT_TEST_EARNINGS.sql](INSERT_TEST_EARNINGS.sql)

**Steps:**
1. Get your IDs:
```sql
-- Find your doctor ID
SELECT id, full_name FROM doctors WHERE is_active = TRUE;

-- Find a user and pet
SELECT id, name FROM users LIMIT 1;
SELECT id, name FROM pets LIMIT 1;
```

2. Create a booking:
```sql
INSERT INTO bookings (
  user_id, pet_id, service_type, booking_type,
  date, time, status, doctor_id,
  payment_status, payment_amount
) VALUES (
  'user-id',
  'pet-id',
  'consultation',
  'online',
  TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
  '10:00',
  'completed',
  'your-doctor-id',
  'paid',
  500.00
) RETURNING id;  -- Save this booking ID!
```

3. Create earnings:
```sql
INSERT INTO doctor_earnings (
  doctor_id,
  booking_id,
  gross_amount,
  platform_commission,
  net_amount,
  status
) VALUES (
  'your-doctor-id',
  'booking-id-from-above',
  500.00,  -- Gross amount
  50.00,   -- Platform commission
  450.00,  -- Net amount (500 - 50)
  'paid'
);
```

4. Create a review:
```sql
INSERT INTO doctor_reviews (
  doctor_id,
  user_id,
  booking_id,
  rating,
  review_text
) VALUES (
  'your-doctor-id',
  'user-id',
  'booking-id-from-above',
  5,
  'Excellent consultation!'
);
```

### Option 3: Wait for Real Bookings

If you're in production:
- ✅ The analytics will populate automatically as:
  - Users book consultations
  - Consultations are completed
  - Earnings are recorded
  - Reviews are submitted

## 🧪 Verify Analytics Are Working

After inserting data, run this to verify:

```sql
-- Replace with your doctor ID
SELECT * FROM get_doctor_analytics('your-doctor-id');

-- Check earnings growth
SELECT calculate_earnings_growth('your-doctor-id');
```

Expected output:
```
doctor_id               | your-doctor-id
total_consultations     | 3
today_total            | 2
today_completed        | 1
today_upcoming         | 1
week_total             | 3
total_earnings         | 1215.00
paid_earnings          | 810.00
pending_earnings       | 405.00
rating                 | 4.5
```

## 📱 Refresh Dashboard

After inserting data:

1. **Hard refresh** your browser:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Or clear cache** and reload

3. **Check browser console** for errors (F12)

## 🎯 Expected Result

After populating data, your dashboard should show:

```
┌─────────────────────────────────┐
│  Analytics                      │
├─────────────────┬───────────────┤
│ Today's Total   │ This Week     │
│       2         │      3        │
│ 1✓ Done | 1⏱Up │               │
├─────────────────┼───────────────┤
│ All Time Total  │  Rating       │
│       3         │    4.5/5      │
├─────────────────┴───────────────┤
│ Total Earnings      ₹1,215.00   │
│ +237.5% ↗                       │
│ Pending: ₹405 • Paid: ₹810      │
└─────────────────────────────────┘
```

## ✅ Troubleshooting

### Still showing 0 after inserting data?

1. **Check if data was inserted**:
```sql
SELECT COUNT(*) FROM doctor_earnings;
SELECT COUNT(*) FROM doctor_reviews;
```

2. **Check if doctor_id matches**:
```sql
-- Get your logged-in doctor's ID
SELECT id, full_name FROM doctors WHERE email = 'your-email@example.com';

-- Check if bookings exist for this doctor
SELECT COUNT(*) FROM bookings WHERE doctor_id = 'your-doctor-id';
```

3. **Verify triggers are working**:
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_update_doctor_stats_realtime';
```

4. **Test RPC function directly**:
```sql
SELECT * FROM get_doctor_analytics('your-doctor-id');
```

### Browser shows old data?

- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Network tab in DevTools
- Verify API is returning new data

### Console errors?

Check browser console (F12) for:
- `getDoctorAnalytics` errors
- Network request failures
- Authentication issues

## 📚 Quick Reference

| File | Purpose |
|------|---------|
| [POPULATE_TEST_DATA.sql](POPULATE_TEST_DATA.sql) | Auto-populate sample data |
| [INSERT_TEST_EARNINGS.sql](INSERT_TEST_EARNINGS.sql) | Manual data insertion guide |
| [TEST_REALTIME_ANALYTICS.sql](TEST_REALTIME_ANALYTICS.sql) | Verify analytics work |

## 🎉 Summary

Your real-time analytics system is **working perfectly**! The cards are empty simply because there's no data yet.

Choose:
- **Testing?** → Use `POPULATE_TEST_DATA.sql`
- **Production?** → Wait for real bookings or use `INSERT_TEST_EARNINGS.sql` for sample data

After populating data, your dashboard will show beautiful, real-time analytics! 🚀
