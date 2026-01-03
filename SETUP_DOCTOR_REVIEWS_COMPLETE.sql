-- =====================================================
-- Doctor Reviews System - Complete Setup
-- =====================================================
-- This script sets up the complete doctor reviews system
-- including automatic average rating calculation
-- =====================================================

-- =====================================================
-- PART 1: Create doctor_reviews table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  doctor_id UUID NOT NULL,
  user_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),

  CONSTRAINT doctor_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_reviews_booking_id_key UNIQUE (booking_id),
  CONSTRAINT doctor_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT doctor_reviews_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE,
  CONSTRAINT doctor_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT doctor_reviews_rating_check CHECK (
    (rating >= 1) AND (rating <= 5)
  )
) TABLESPACE pg_default;

-- =====================================================
-- PART 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id
ON public.doctor_reviews USING btree (doctor_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_user_id
ON public.doctor_reviews USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_booking_id
ON public.doctor_reviews USING btree (booking_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_created_at
ON public.doctor_reviews USING btree (created_at DESC) TABLESPACE pg_default;

-- =====================================================
-- PART 3: Enable Row Level Security
-- =====================================================

ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;

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
-- PART 4: Create function to auto-update doctor rating
-- =====================================================

CREATE OR REPLACE FUNCTION update_doctor_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3, 1);
  review_count INTEGER;
BEGIN
  -- Calculate average rating and count for the doctor
  SELECT
    ROUND(AVG(rating)::NUMERIC, 1),
    COUNT(*)
  INTO avg_rating, review_count
  FROM doctor_reviews
  WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id);

  -- Update doctor's rating
  UPDATE doctors
  SET
    rating = COALESCE(avg_rating, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.doctor_id, OLD.doctor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Create trigger for automatic rating updates
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_doctor_rating ON doctor_reviews;

CREATE TRIGGER trigger_update_doctor_rating
AFTER INSERT OR UPDATE OF rating OR DELETE ON doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_doctor_rating_on_review();

-- =====================================================
-- PART 6: Create trigger for updated_at timestamp
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
-- PART 7: Add helpful comments
-- =====================================================

COMMENT ON TABLE doctor_reviews IS 'Stores user ratings and reviews for doctors after completed consultations';
COMMENT ON COLUMN doctor_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN doctor_reviews.review_text IS 'Optional text review from the user';
COMMENT ON COLUMN doctor_reviews.booking_id IS 'Unique booking - one review per booking';
COMMENT ON TRIGGER trigger_update_doctor_rating ON doctor_reviews IS 'Automatically updates doctor average rating when reviews are added, updated, or deleted';

-- =====================================================
-- PART 8: Verification & Test
-- =====================================================

-- Test the trigger by inserting sample data (optional - comment out if not needed)
/*
-- Insert a test review (replace with actual UUIDs from your database)
INSERT INTO doctor_reviews (doctor_id, user_id, booking_id, rating, review_text)
VALUES (
  'YOUR_DOCTOR_ID',
  'YOUR_USER_ID',
  'YOUR_BOOKING_ID',
  5,
  'Excellent service! Very caring and professional.'
);

-- Check if the doctor's rating was updated
SELECT id, full_name, rating
FROM doctors
WHERE id = 'YOUR_DOCTOR_ID';
*/

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
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'doctor_reviews';

-- Check triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'doctor_reviews';

-- =====================================================
-- SUCCESS!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Doctor Reviews System Setup Complete!';
  RAISE NOTICE '📊 Reviews will automatically update doctor average ratings';
  RAISE NOTICE '⭐ Ratings are displayed in the Doctor Dashboard';
  RAISE NOTICE '🔒 Row Level Security is enabled for data protection';
END $$;
