-- Enable RLS on grooming_time_slots table
ALTER TABLE public.grooming_time_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Grooming stores can manage their own time slots" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Public can view active time slots" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable insert for grooming store owners" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable update for grooming store owners" ON public.grooming_time_slots;
DROP POLICY IF EXISTS "Enable delete for grooming store owners" ON public.grooming_time_slots;

-- Allow grooming stores to read their own time slots
CREATE POLICY "Enable read access for all authenticated users"
ON public.grooming_time_slots
FOR SELECT
TO authenticated
USING (true);

-- Allow grooming stores to insert their own time slots
CREATE POLICY "Enable insert for grooming store owners"
ON public.grooming_time_slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_time_slots.grooming_store_id
    AND gs.user_id = auth.uid()
  )
);

-- Allow grooming stores to update their own time slots
CREATE POLICY "Enable update for grooming store owners"
ON public.grooming_time_slots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_time_slots.grooming_store_id
    AND gs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_time_slots.grooming_store_id
    AND gs.user_id = auth.uid()
  )
);

-- Allow grooming stores to delete their own time slots
CREATE POLICY "Enable delete for grooming store owners"
ON public.grooming_time_slots
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.grooming_stores gs
    WHERE gs.id = grooming_time_slots.grooming_store_id
    AND gs.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT SELECT ON public.grooming_time_slots TO authenticated;
GRANT INSERT ON public.grooming_time_slots TO authenticated;
GRANT UPDATE ON public.grooming_time_slots TO authenticated;
GRANT DELETE ON public.grooming_time_slots TO authenticated;
