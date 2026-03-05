-- ============================================
-- COMPLETE FIX FOR GROOMING TIME SLOTS
-- ============================================

-- Step 1: Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.grooming_time_slots CASCADE;

-- Step 2: Create the table with all necessary columns
CREATE TABLE public.grooming_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  grooming_store_id UUID NOT NULL,
  time_slot TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  weekdays INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 1=Monday, ..., 6=Saturday
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT grooming_time_slots_pkey PRIMARY KEY (id),
  CONSTRAINT grooming_time_slots_grooming_store_id_time_slot_key UNIQUE (grooming_store_id, time_slot),
  CONSTRAINT grooming_time_slots_grooming_store_id_fkey FOREIGN KEY (grooming_store_id)
    REFERENCES grooming_stores(id) ON DELETE CASCADE
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grooming_time_slots_store_id
  ON public.grooming_time_slots USING btree (grooming_store_id);

CREATE INDEX IF NOT EXISTS idx_grooming_time_slots_active
  ON public.grooming_time_slots USING btree (grooming_store_id, is_active);

-- Step 4: Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger
DROP TRIGGER IF EXISTS update_grooming_time_slots_updated_at ON public.grooming_time_slots;

CREATE TRIGGER update_grooming_time_slots_updated_at
  BEFORE UPDATE ON public.grooming_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security
ALTER TABLE public.grooming_time_slots ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop all existing policies
DROP POLICY IF EXISTS "Grooming stores can manage their own time slots" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Anyone can view active time slots" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Public can view active time slots" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable insert for grooming store owners" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable update for grooming store owners" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable delete for grooming store owners" ON public.grooming_time_slots;

-- Step 8: Create comprehensive RLS policies

-- Allow authenticated users to view all time slots (for booking purposes)
CREATE POLICY "Enable read access for all authenticated users"
ON public.grooming_time_slots
FOR SELECT
TO authenticated
USING (true);

-- Allow public (anon) users to view active time slots
CREATE POLICY "Public can view active time slots"
ON public.grooming_time_slots
FOR SELECT
TO anon
USING (is_active = true);

-- Allow grooming store owners to insert their own time slots
CREATE POLICY "Enable insert for grooming store owners"
ON public.grooming_time_slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_store_id
    AND gs.user_id = auth.uid()
  )
);

-- Allow grooming store owners to update their own time slots
CREATE POLICY "Enable update for grooming store owners"
ON public.grooming_time_slots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_store_id
    AND gs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_store_id
    AND gs.user_id = auth.uid()
  )
);

-- Allow grooming store owners to delete their own time slots
CREATE POLICY "Enable delete for grooming store owners"
ON public.grooming_time_slots
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_store_id
    AND gs.user_id = auth.uid()
  )
);

-- Step 9: Grant necessary permissions
GRANT SELECT ON public.grooming_time_slots TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.grooming_time_slots TO authenticated;

-- Step 10: Verify the setup
-- Run this to check if everything is set up correctly:
-- SELECT * FROM pg_policies WHERE tablename = 'grooming_time_slots';
-- SELECT * FROM information_schema.columns WHERE table_name = 'grooming_time_slots';

COMMENT ON TABLE public.grooming_time_slots IS 'Stores available time slots for grooming stores with weekday availability';
COMMENT ON COLUMN public.grooming_time_slots.weekdays IS 'Array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday) when this time slot is available';
