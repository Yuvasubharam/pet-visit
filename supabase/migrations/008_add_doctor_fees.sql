-- ============================================================================
-- Add Doctor Fee Management
-- ============================================================================
-- This migration adds fee columns to the doctors table for different consultation types

-- Add fee columns to doctors table
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS fee_online_video DECIMAL(10, 2) DEFAULT 400.00,
ADD COLUMN IF NOT EXISTS fee_online_chat DECIMAL(10, 2) DEFAULT 250.00,
ADD COLUMN IF NOT EXISTS fee_home_visit DECIMAL(10, 2) DEFAULT 850.00,
ADD COLUMN IF NOT EXISTS fee_clinic_visit DECIMAL(10, 2) DEFAULT 500.00;

-- Add comments for documentation
COMMENT ON COLUMN public.doctors.fee_online_video IS 'Fee for online video consultation in INR';
COMMENT ON COLUMN public.doctors.fee_online_chat IS 'Fee for online chat consultation in INR';
COMMENT ON COLUMN public.doctors.fee_home_visit IS 'Fee for home visit consultation in INR';
COMMENT ON COLUMN public.doctors.fee_clinic_visit IS 'Fee for clinic visit consultation in INR';

-- Update existing doctors with default fees if they don't have values
UPDATE public.doctors
SET
  fee_online_video = COALESCE(fee_online_video, 400.00),
  fee_online_chat = COALESCE(fee_online_chat, 250.00),
  fee_home_visit = COALESCE(fee_home_visit, 850.00),
  fee_clinic_visit = COALESCE(fee_clinic_visit, 500.00)
WHERE fee_online_video IS NULL
   OR fee_online_chat IS NULL
   OR fee_home_visit IS NULL
   OR fee_clinic_visit IS NULL;

-- Display current doctor fees
SELECT
  id,
  full_name,
  email,
  fee_online_video,
  fee_online_chat,
  fee_home_visit,
  fee_clinic_visit
FROM public.doctors
WHERE is_active = TRUE
ORDER BY created_at DESC;
