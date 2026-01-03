# Doctor Rating Update Guide

This guide explains how to update the doctor dashboard to display average ratings from the `doctor_reviews` table instead of the static rating from the `doctors` table.

## What Changed?

### 1. Database Changes
- **Updated `doctor_analytics` view**: Now calculates `average_rating` from the `doctor_reviews` table
- **Updated `get_doctor_analytics()` function**: Returns the average rating and total review count
- **Added `total_reviews` field**: Shows how many reviews a doctor has received

### 2. How It Works
- The system now calculates the average rating in real-time from patient reviews
- If a doctor has no reviews, the rating displays as `0.0`
- The rating is automatically updated whenever a new review is added, updated, or deleted (thanks to existing triggers)

## How to Apply

### Step 1: Run the SQL Migration

Execute the SQL file in your Supabase SQL Editor:

```bash
# Copy the contents of UPDATE_DOCTOR_RATING_FROM_REVIEWS.sql
# and run it in your Supabase SQL Editor
```

Or if you have Supabase CLI:

```bash
supabase db push
```

### Step 2: Verify the Changes

Run this test query to verify the update worked:

```sql
-- Test the updated function
SELECT * FROM get_doctor_analytics('your-doctor-id-here');

-- Check the view directly
SELECT doctor_id, full_name, average_rating, total_reviews
FROM doctor_analytics
LIMIT 5;
```

### Step 3: Test in the Dashboard

1. Log in to the doctor dashboard
2. Check the "Patient Rating" stat card
3. The rating should now reflect the average from patient reviews
4. If the doctor has no reviews, it will show `0.0/5`

## Expected Behavior

### Before the Update
- Rating was static from the `doctors.rating` column
- Not updated based on patient feedback
- Could be manually set but not accurate

### After the Update
- Rating is calculated from actual patient reviews
- Automatically updates when new reviews are added
- Shows `0.0` if no reviews exist
- Displays the actual average (e.g., `4.3/5` if average is 4.3)

## Dashboard Display

The doctor dashboard already has the correct UI code in place at [DoctorDashboard.tsx:256-269](DoctorDashboard.tsx#L256-L269):

```typescript
{/* Rating Card */}
<div className="...">
  <div className="...">
    <span className="material-symbols-outlined text-[20px]">star</span>
  </div>
  <div className="flex items-baseline gap-1">
    <span className="text-3xl font-bold text-slate-900 dark:text-dark">
      {analytics.rating ? analytics.rating.toFixed(1) : '0.0'}
    </span>
    <span className="text-xs text-slate-700">/5</span>
  </div>
  <span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
    Patient Rating
  </span>
</div>
```

The `analytics.rating` field will now contain the average rating from reviews.

## Testing the Feature

### 1. Add Test Reviews

```sql
-- Add some test reviews for a doctor
INSERT INTO doctor_reviews (doctor_id, user_id, booking_id, rating, review_text)
VALUES
  ('doctor-uuid', 'user-uuid-1', 'booking-uuid-1', 5, 'Excellent service!'),
  ('doctor-uuid', 'user-uuid-2', 'booking-uuid-2', 4, 'Very good'),
  ('doctor-uuid', 'user-uuid-3', 'booking-uuid-3', 5, 'Highly recommend');

-- Check the average rating
SELECT doctor_id, average_rating, total_reviews
FROM doctor_analytics
WHERE doctor_id = 'doctor-uuid';

-- Expected result: average_rating = 4.67, total_reviews = 3
```

### 2. Verify in Dashboard

1. Refresh the doctor dashboard
2. The rating card should show `4.7/5` (rounded to 1 decimal)
3. This updates in real-time as new reviews are added

## Trigger Behavior

The existing trigger `trigger_update_doctor_rating_on_review` (from CREATE_DOCTOR_REVIEWS_TABLE.sql) automatically:
- Updates the `doctors.rating` column when reviews change
- This trigger still works and maintains the doctors table
- Our new view calculates directly from reviews for accuracy

## API Response Example

The `doctorAnalyticsService.getDoctorAnalytics()` function returns:

```typescript
{
  total_consultations: 25,
  today_total: 3,
  today_completed: 1,
  today_upcoming: 2,
  today_cancelled: 0,
  week_total: 8,
  pending_requests: 2,
  total_earnings: 5000.00,
  paid_earnings: 4000.00,
  pending_earnings: 1000.00,
  rating: 4.67,        // ← Average from doctor_reviews
  total_reviews: 3     // ← NEW: Total review count
}
```

## Rollback (if needed)

If you need to revert to the old behavior, run:

```sql
-- Restore the old view that uses doctors.rating
DROP VIEW IF EXISTS doctor_analytics CASCADE;

-- Re-run the original migration
-- (Copy content from supabase/migrations/011_realtime_analytics.sql)
```

## Additional Enhancements (Optional)

You could further enhance the dashboard by:

1. **Show Review Count**: Display "(Based on X reviews)" below the rating
2. **Star Visualization**: Show stars instead of just a number
3. **Recent Reviews Section**: Add a section showing recent patient reviews
4. **Rating Breakdown**: Show distribution (5 stars: X, 4 stars: Y, etc.)

Example enhancement for showing review count:

```typescript
<span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
  Patient Rating
  {analytics.total_reviews > 0 && (
    <span className="block text-[10px] text-slate-500">
      ({analytics.total_reviews} review{analytics.total_reviews !== 1 ? 's' : ''})
    </span>
  )}
</span>
```

## Summary

✅ Database view updated to calculate rating from reviews
✅ Function returns average rating and review count
✅ Dashboard displays real-time patient ratings
✅ Automatically updates when reviews are added/updated
✅ Shows 0.0 when no reviews exist

Your doctor dashboard now shows accurate, real-time patient ratings!
