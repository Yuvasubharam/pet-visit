-- ============================================
-- Add Clinic Location Coordinates to Doctors Table
-- ============================================
-- Run this in Supabase SQL Editor to add location tracking

-- Add latitude and longitude columns to doctors table
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS clinic_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS clinic_longitude NUMERIC(11, 8);

-- Add index for location-based queries (optional, for future geospatial queries)
CREATE INDEX IF NOT EXISTS idx_doctors_location
ON public.doctors (clinic_latitude, clinic_longitude);

-- Add comment to document the columns
COMMENT ON COLUMN public.doctors.clinic_latitude IS 'Latitude coordinate of clinic location (-90 to 90)';
COMMENT ON COLUMN public.doctors.clinic_longitude IS 'Longitude coordinate of clinic location (-180 to 180)';

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
  AND column_name IN ('clinic_latitude', 'clinic_longitude');
