-- Add weekday field to doctor_availability table for recurring availability
ALTER TABLE doctor_availability
ADD COLUMN IF NOT EXISTS weekday INTEGER CHECK (weekday >= 0 AND weekday <= 6);

-- Add comment to explain weekday values
COMMENT ON COLUMN doctor_availability.weekday IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- Create index for weekday queries
CREATE INDEX IF NOT EXISTS idx_doctor_availability_weekday ON doctor_availability(weekday);

-- Drop the old unique constraint
ALTER TABLE doctor_availability
DROP CONSTRAINT IF EXISTS doctor_availability_doctor_id_date_start_time_slot_type_key;

-- Add new unique constraint that includes weekday
-- This allows same time slots on different days
CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_unique_slot
ON doctor_availability (doctor_id, date, start_time, slot_type)
WHERE weekday IS NULL;

-- Add unique constraint for recurring slots (weekday-based)
CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_unique_recurring_slot
ON doctor_availability (doctor_id, weekday, start_time, slot_type)
WHERE weekday IS NOT NULL AND date IS NULL;
