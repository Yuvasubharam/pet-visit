-- Add date_of_birth column to pets table
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add comment to explain the column
COMMENT ON COLUMN public.pets.date_of_birth IS 'Date of birth of the pet. Age is calculated from this field.';
