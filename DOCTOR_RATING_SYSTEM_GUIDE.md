# Doctor Rating System - Complete Guide

## Overview
Your doctor dashboard already fetches and displays the average rating automatically! This guide explains how it works and how to use it.

## How It Works

### 1. Database Flow
```
User submits review → doctor_reviews table
                    ↓
            Trigger activates
                    ↓
     Calculate AVG(rating) for doctor
                    ↓
        Update doctors.rating column
                    ↓
    Dashboard fetches from get_doctor_analytics()
                    ↓
        Display in Rating stat card
```

### 2. Components Already in Place

#### ✅ Database Table
- `doctor_reviews` table stores all reviews
- Columns: `id`, `doctor_id`, `user_id`, `booking_id`, `rating` (1-5), `review_text`
- Constraint: One review per booking

#### ✅ Automatic Rating Calculation
- **Trigger**: `trigger_update_doctor_rating`
- **Function**: `update_doctor_rating_on_review()`
- **Action**: Automatically calculates AVG(rating) and updates `doctors.rating`

#### ✅ Dashboard Integration
- **Location**: [DoctorDashboard.tsx:255-269](DoctorDashboard.tsx#L255-L269)
- **Service**: [doctorApi.ts:888-910](services/doctorApi.ts#L888-L910)
- **Function**: `get_doctor_analytics(doctorId)` returns the rating
- **Display**: Shows rating with ⭐ icon (e.g., "4.5/5")

### 3. Rating Display in Dashboard

The rating is displayed in a stat card:
```tsx
{/* Rating Card - Line 255-269 */}
<div className="bg-white dark:bg-surface-dark p-4 rounded-2xl">
  <div className="h-10 w-10 rounded-full bg-orange-50">
    <span className="material-symbols-outlined">star</span>
  </div>
  <div className="flex items-baseline gap-1">
    <span className="text-3xl font-bold">
      {analytics.rating ? analytics.rating.toFixed(1) : '0.0'}
    </span>
    <span className="text-xs">/5</span>
  </div>
  <span className="text-xs">Patient Rating</span>
</div>
```

## Setup Instructions

### Step 1: Apply Database Schema
Run this SQL in Supabase SQL Editor:
```bash
# Open Supabase Dashboard → SQL Editor
# Copy and paste the contents of:
SETUP_DOCTOR_REVIEWS_COMPLETE.sql
```

### Step 2: Verify Installation
After running the SQL, verify:

1. **Table exists**:
   ```sql
   SELECT * FROM doctor_reviews LIMIT 5;
   ```

2. **Trigger is active**:
   ```sql
   SELECT trigger_name FROM information_schema.triggers
   WHERE event_object_table = 'doctor_reviews';
   ```

3. **Rating updates work**:
   ```sql
   -- Insert test review (use real IDs from your DB)
   INSERT INTO doctor_reviews (doctor_id, user_id, booking_id, rating, review_text)
   VALUES (
     'your-doctor-id',
     'your-user-id',
     'your-booking-id',
     5,
     'Great doctor!'
   );

   -- Check if rating updated
   SELECT full_name, rating FROM doctors WHERE id = 'your-doctor-id';
   ```

## Using the Review Service

### Create a Review (Frontend)
```typescript
import { doctorReviewService } from '../services/doctorApi';

// After a completed consultation
const submitReview = async () => {
  try {
    await doctorReviewService.createReview({
      doctor_id: booking.doctor_id,
      user_id: currentUser.id,
      booking_id: booking.id,
      rating: 5, // 1-5 stars
      review_text: 'Excellent service!' // Optional
    });

    // Rating automatically updates in doctor's dashboard!
    alert('Review submitted successfully!');
  } catch (error) {
    console.error('Error submitting review:', error);
  }
};
```

### Get Doctor Reviews
```typescript
// Get all reviews for a doctor
const reviews = await doctorReviewService.getDoctorReviews(doctorId);

// Reviews include user info:
reviews.forEach(review => {
  console.log(review.rating); // 1-5
  console.log(review.review_text); // Optional text
  console.log(review.users.name); // Reviewer name
  console.log(review.users.profile_photo_url); // Reviewer photo
});
```

## Dashboard Stats Card Features

### Current Implementation
- ⭐ **Icon**: Star icon in orange background
- 📊 **Display**: Shows rating like "4.5/5"
- 🎨 **Styling**: Matches other stat cards
- 🔄 **Real-time**: Updates when reviews are added/updated

### What Updates the Rating
The rating updates automatically when:
- ✅ A new review is inserted
- ✅ An existing review is updated (rating changed)
- ✅ A review is deleted

### Rating Calculation
- **Formula**: `AVG(rating)` of all reviews for that doctor
- **Precision**: Rounded to 1 decimal place (e.g., 4.5)
- **Default**: Shows "0.0" if no reviews exist

## Files Reference

### Database
- `SETUP_DOCTOR_REVIEWS_COMPLETE.sql` - Complete setup script

### Frontend
- [DoctorDashboard.tsx](DoctorDashboard.tsx) - Rating display (line 255-269)
- [services/doctorApi.ts](services/doctorApi.ts) - Review services (line 740-794)

### Key Functions
- `update_doctor_rating_on_review()` - Auto-calculates average rating
- `get_doctor_analytics()` - Fetches rating for dashboard
- `doctorReviewService.createReview()` - Submit new review
- `doctorReviewService.getDoctorReviews()` - Get all reviews

## Example: Complete Review Flow

```typescript
// 1. User completes consultation
// 2. Booking status becomes 'completed'
// 3. Show review form to user
// 4. User submits rating and review

const handleReviewSubmit = async (bookingId: string, rating: number, reviewText?: string) => {
  try {
    // Get booking details
    const booking = await doctorConsultationService.getBookingDetails(bookingId);

    // Submit review
    await doctorReviewService.createReview({
      doctor_id: booking.doctor_id,
      user_id: booking.user_id,
      booking_id: bookingId,
      rating: rating,
      review_text: reviewText
    });

    // Database trigger automatically:
    // 1. Calculates new average rating
    // 2. Updates doctors.rating column
    // 3. Doctor dashboard shows updated rating immediately

    console.log('✅ Review submitted and rating updated!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

## Testing Checklist

- [ ] Run `SETUP_DOCTOR_REVIEWS_COMPLETE.sql` in Supabase
- [ ] Insert a test review with rating 5
- [ ] Check that `doctors.rating` is updated to 5.0
- [ ] Insert another review with rating 3
- [ ] Check that `doctors.rating` is updated to 4.0 (average of 5 and 3)
- [ ] Open doctor dashboard
- [ ] Verify rating shows "4.0/5" in the stat card
- [ ] Delete one review
- [ ] Verify rating updates automatically

## Troubleshooting

### Rating Not Showing
1. Check if `get_doctor_analytics()` function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'get_doctor_analytics';
   ```

2. Run analytics function manually:
   ```sql
   SELECT * FROM get_doctor_analytics('your-doctor-id');
   ```

### Rating Not Updating
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_doctor_rating';
   ```

2. Manually update rating:
   ```sql
   SELECT update_doctor_rating_on_review();
   ```

## Summary

✅ **Already Implemented**: Your doctor dashboard fetches and displays ratings automatically!

✅ **Auto-Update**: Ratings update in real-time when reviews are submitted

✅ **Location**: Rating card is at [DoctorDashboard.tsx:255-269](DoctorDashboard.tsx#L255-L269)

✅ **Setup Required**: Just run `SETUP_DOCTOR_REVIEWS_COMPLETE.sql` once

🎯 **Next Step**: Apply the SQL migration and start collecting reviews!
