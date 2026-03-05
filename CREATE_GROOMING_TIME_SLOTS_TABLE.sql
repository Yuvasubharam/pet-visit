-- Create grooming_time_slots table for managing grooming store availability
CREATE TABLE IF NOT EXISTS grooming_time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grooming_store_id UUID NOT NULL REFERENCES grooming_stores(id) ON DELETE CASCADE,
  time_slot TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  weekdays INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 1=Monday, ..., 6=Saturday
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grooming_store_id, time_slot)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_grooming_time_slots_store_id ON grooming_time_slots(grooming_store_id);
CREATE INDEX IF NOT EXISTS idx_grooming_time_slots_active ON grooming_time_slots(grooming_store_id, is_active);

-- Enable RLS
ALTER TABLE grooming_time_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Grooming stores can manage their own time slots" ON grooming_time_slots;
DROP POLICY IF EXISTS "Anyone can view active time slots" ON grooming_time_slots;

-- Policy: Grooming stores can manage their own time slots
CREATE POLICY "Grooming stores can manage their own time slots"
ON grooming_time_slots
FOR ALL
USING (
  grooming_store_id IN (
    SELECT id FROM grooming_stores WHERE user_id = auth.uid()
  )
);

-- Policy: Anyone can view active time slots (for booking purposes)
CREATE POLICY "Anyone can view active time slots"
ON grooming_time_slots
FOR SELECT
USING (is_active = true);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_grooming_time_slots_updated_at ON grooming_time_slots;

-- Create trigger
CREATE TRIGGER update_grooming_time_slots_updated_at
  BEFORE UPDATE ON grooming_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
