-- =====================================================
-- Doctor Reviews Table Setup
-- =====================================================
-- Purpose: Allow users to rate and review doctors after consultations
-- =====================================================

-- Create doctor_reviews table
CREATE TABLE IF NOT EXISTS doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one review per booking per user
  CONSTRAINT unique_review_per_booking_user UNIQUE (booking_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_user_id ON doctor_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_booking_id ON doctor_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_created_at ON doctor_reviews(created_at DESC);

-- Add comments
COMMENT ON TABLE doctor_reviews IS 'Stores user ratings and reviews for doctors after completed consultations';
COMMENT ON COLUMN doctor_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN doctor_reviews.review_text IS 'Optional text review from the user';

-- Enable Row Level Security
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON doctor_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON doctor_reviews;

-- Users can view all reviews
CREATE POLICY "Anyone can view reviews"
ON doctor_reviews FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own reviews
CREATE POLICY "Users can create their own reviews"
ON doctor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON doctor_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON doctor_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- Create function to update doctor rating on new review
-- =====================================================

CREATE OR REPLACE FUNCTION update_doctor_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3, 1);
BEGIN
  -- Calculate average rating for the doctor
  SELECT ROUND(AVG(rating)::NUMERIC, 1)
  INTO avg_rating
  FROM doctor_reviews
  WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id);

  -- Update doctor's rating
  UPDATE doctors
  SET rating = COALESCE(avg_rating, 0),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.doctor_id, OLD.doctor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trigger_update_doctor_rating ON doctor_reviews;

CREATE TRIGGER trigger_update_doctor_rating
AFTER INSERT OR UPDATE OR DELETE ON doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_doctor_rating_on_review();

-- =====================================================
-- Update updated_at timestamp trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doctor_reviews_updated_at ON doctor_reviews;

CREATE TRIGGER trigger_doctor_reviews_updated_at
BEFORE UPDATE ON doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'doctor_reviews'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'doctor_reviews';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'doctor_reviews';

COMMENT ON TRIGGER trigger_update_doctor_rating ON doctor_reviews IS 'Automatically updates doctor average rating when reviews are added, updated, or deleted';
