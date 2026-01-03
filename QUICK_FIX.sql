-- ========================================
-- QUICK FIX: Add weekday column
-- Copy and paste this entire script into Supabase SQL Editor
-- ========================================

-- Add the weekday column
ALTER TABLE public.doctor_availability
ADD COLUMN IF NOT EXISTS weekday INTEGER
CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));

-- Add index
CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday
ON public.doctor_availability (weekday);

-- Add comment
COMMENT ON COLUMN public.doctor_availability.weekday
IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
