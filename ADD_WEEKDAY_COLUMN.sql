-- ========================================
-- Add weekday column to doctor_availability
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Add weekday column (if it doesn't exist)
ALTER TABLE public.doctor_availability
ADD COLUMN IF NOT EXISTS weekday INTEGER;

-- Step 2: Add check constraint for weekday (0-6)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'doctor_availability_weekday_check'
    ) THEN
        ALTER TABLE public.doctor_availability
        ADD CONSTRAINT doctor_availability_weekday_check
        CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));
    END IF;
END $$;

-- Step 3: Add comment to explain weekday values
COMMENT ON COLUMN public.doctor_availability.weekday IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday
ON public.doctor_availability USING btree (weekday);

-- Step 5: Drop old unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'doctor_availability_doctor_id_date_start_time_slot_type_key'
    ) THEN
        ALTER TABLE public.doctor_availability
        DROP CONSTRAINT doctor_availability_doctor_id_date_start_time_slot_type_key;
    END IF;
END $$;

-- Step 6: Create unique index for date-specific slots (where weekday is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_unique_slot
ON public.doctor_availability (doctor_id, date, start_time, slot_type)
WHERE weekday IS NULL;

-- Step 7: Create unique index for recurring slots (where weekday is NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_unique_recurring_slot
ON public.doctor_availability (doctor_id, weekday, start_time, slot_type)
WHERE weekday IS NOT NULL AND date IS NULL;

-- ========================================
-- Verification Query
-- Run this to verify the changes
-- ========================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctor_availability'
ORDER BY ordinal_position;
