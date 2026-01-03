# Optional Enhancements for Doctor Rating System

## 1. Show Review Count in Dashboard

Currently, the dashboard shows the average rating (e.g., "4.5/5"). You can optionally display the number of reviews too (e.g., "4.5/5 (24 reviews)").

### Option A: Add review count to analytics function

Update the `get_doctor_analytics` function to include review count:

```sql
-- Add this to your analytics function
CREATE OR REPLACE FUNCTION get_doctor_analytics(p_doctor_id UUID)
RETURNS TABLE (
  doctor_id UUID,
  total_consultations BIGINT,
  today_total BIGINT,
  today_completed BIGINT,
  today_upcoming BIGINT,
  today_cancelled BIGINT,
  week_total BIGINT,
  pending_requests BIGINT,
  total_earnings NUMERIC,
  paid_earnings NUMERIC,
  pending_earnings NUMERIC,
  rating NUMERIC,
  review_count BIGINT  -- ADD THIS
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    da.doctor_id,
    da.total_consultations,
    da.today_total,
    da.today_completed,
    da.today_upcoming,
    da.today_cancelled,
    da.week_total,
    (
      SELECT COUNT(*)
      FROM bookings b
      WHERE (b.doctor_id IS NULL OR (b.doctor_id = p_doctor_id AND b.status = 'pending'))
      AND b.service_type = 'consultation'
      AND b.status != 'cancelled'
    )::BIGINT as pending_requests,
    da.total_earnings,
    da.paid_earnings,
    da.pending_earnings,
    da.rating,
    (
      SELECT COUNT(*)
      FROM doctor_reviews dr
      WHERE dr.doctor_id = p_doctor_id
    )::BIGINT as review_count  -- ADD THIS
  FROM doctor_analytics da
  WHERE da.doctor_id = p_doctor_id;
END;
$$ LANGUAGE plpgsql;
```

### Option B: Fetch review count separately

Add a new method to `doctorAnalyticsService`:

```typescript
// In services/doctorApi.ts, add to doctorAnalyticsService:

async getReviewCount(doctorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('doctor_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId);

  if (error) throw error;
  return count || 0;
}
```

Then update the dashboard:

```typescript
// In DoctorDashboard.tsx

const [reviewCount, setReviewCount] = useState(0);

// In loadDashboardData():
const count = await doctorAnalyticsService.getReviewCount(doctorId);
setReviewCount(count);

// In the rating card (line 255-269), update to:
<span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
  Patient Rating {reviewCount > 0 && `(${reviewCount} reviews)`}
</span>
```

## 2. Add Star Visualization

Show visual stars instead of just a number:

```typescript
// Add this component to DoctorDashboard.tsx

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="material-symbols-outlined text-orange-500 text-sm">
          star
        </span>
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <span className="material-symbols-outlined text-orange-500 text-sm">
          star_half
        </span>
      )}

      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="material-symbols-outlined text-slate-300 text-sm">
          star
        </span>
      ))}

      <span className="text-xs text-slate-600 ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

// Use it in the rating card:
<div className="flex items-baseline gap-1">
  <span className="text-3xl font-bold text-slate-900 dark:text-dark">
    {analytics.rating ? analytics.rating.toFixed(1) : '0.0'}
  </span>
  <span className="text-xs text-slate-700">/5</span>
</div>
<StarRating rating={analytics.rating || 0} />
```

## 3. Add Recent Reviews Section

Display recent reviews below the stat cards:

```typescript
// In DoctorDashboard.tsx

const [recentReviews, setRecentReviews] = useState<any[]>([]);

// In loadDashboardData():
const reviews = await doctorReviewService.getDoctorReviews(doctorId);
setRecentReviews(reviews.slice(0, 3)); // Get 3 most recent

// Add this section after the analytics cards:
{recentReviews.length > 0 && (
  <section>
    <h2 className="text-lg font-bold text-slate-900 dark:text-dark mb-4">
      Recent Reviews
    </h2>
    <div className="space-y-3">
      {recentReviews.map((review) => (
        <div
          key={review.id}
          className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
              {review.users?.profile_photo_url ? (
                <img src={review.users.profile_photo_url} alt="" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">person</span>
                </div>
              )}
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-slate-900 dark:text-dark">
                  {review.users?.name || 'Anonymous'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-orange-500 text-sm">star</span>
                  <span className="text-sm font-bold text-slate-900">{review.rating}</span>
                </div>
              </div>

              {review.review_text && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {review.review_text}
                </p>
              )}

              <span className="text-[10px] text-slate-400 mt-1 block">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
```

## 4. Rating Breakdown

Show distribution of ratings (how many 5-star, 4-star, etc.):

```typescript
// Create a new analytics function in SQL:
CREATE OR REPLACE FUNCTION get_rating_breakdown(p_doctor_id UUID)
RETURNS TABLE (
  rating INTEGER,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH rating_counts AS (
    SELECT
      r.rating,
      COUNT(*) as count,
      (SELECT COUNT(*) FROM doctor_reviews WHERE doctor_id = p_doctor_id) as total
    FROM doctor_reviews r
    WHERE r.doctor_id = p_doctor_id
    GROUP BY r.rating
  )
  SELECT
    rc.rating,
    rc.count,
    ROUND((rc.count::NUMERIC / NULLIF(rc.total, 0)) * 100, 1) as percentage
  FROM rating_counts rc
  ORDER BY rc.rating DESC;
END;
$$ LANGUAGE plpgsql;

// Then in the dashboard:
{/* Rating Breakdown */}
<div className="bg-white p-4 rounded-2xl">
  <h3 className="font-bold mb-3">Rating Breakdown</h3>
  <div className="space-y-2">
    {[5, 4, 3, 2, 1].map((star) => {
      const data = ratingBreakdown.find(r => r.rating === star);
      const percentage = data?.percentage || 0;
      return (
        <div key={star} className="flex items-center gap-2">
          <span className="text-xs w-3">{star}</span>
          <span className="material-symbols-outlined text-orange-500 text-xs">star</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-slate-600 w-10 text-right">
            {percentage.toFixed(0)}%
          </span>
        </div>
      );
    })}
  </div>
</div>
```

## 5. Add Review Form for Users

Create a component for users to submit reviews after a completed consultation:

```typescript
// components/ReviewForm.tsx
import React, { useState } from 'react';
import { doctorReviewService } from '../services/doctorApi';

interface ReviewFormProps {
  bookingId: string;
  doctorId: string;
  userId: string;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  bookingId,
  doctorId,
  userId,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await doctorReviewService.createReview({
        doctor_id: doctorId,
        user_id: userId,
        booking_id: bookingId,
        rating,
        review_text: reviewText || undefined
      });

      alert('Review submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h3 className="text-lg font-bold mb-4">Rate Your Experience</h3>

      {/* Star Rating */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <span
              className={`material-symbols-outlined text-3xl ${
                star <= (hoveredRating || rating)
                  ? 'text-orange-500'
                  : 'text-slate-300'
              }`}
            >
              star
            </span>
          </button>
        ))}
      </div>

      {/* Review Text */}
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Share your experience (optional)"
        className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={4}
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
};

export default ReviewForm;
```

## Summary

These enhancements are **optional** but can improve the user experience:

1. ✅ **Review Count** - Show how many reviews (e.g., "4.5/5 (24 reviews)")
2. ⭐ **Star Visualization** - Visual star rating display
3. 💬 **Recent Reviews** - Show latest 3 reviews in dashboard
4. 📊 **Rating Breakdown** - Distribution chart of ratings
5. 📝 **Review Form** - Allow users to submit reviews

The core functionality is already complete - these are just nice-to-have additions!
