-- Fix RLS policies for grooming_packages table
-- This allows authenticated users to read packages and service role to insert

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to grooming packages" ON grooming_packages;
DROP POLICY IF EXISTS "Allow service role to insert grooming packages" ON grooming_packages;
DROP POLICY IF EXISTS "Allow authenticated users to read grooming packages" ON grooming_packages;

-- Enable RLS
ALTER TABLE grooming_packages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read packages
CREATE POLICY "Allow authenticated users to read grooming packages"
ON grooming_packages
FOR SELECT
TO authenticated
USING (true);

-- Allow anyone to read packages (for public display)
CREATE POLICY "Allow public read access to grooming packages"
ON grooming_packages
FOR SELECT
TO anon
USING (true);

-- Temporarily disable RLS to insert default packages
ALTER TABLE grooming_packages DISABLE ROW LEVEL SECURITY;

-- Insert default grooming packages (if they don't exist)
INSERT INTO grooming_packages (name, description, price, package_type, duration_minutes)
VALUES
  ('Standard Bath', 'Deep cleaning, drying, nail clipping & ear hygiene.', 40.00, 'basic', 45),
  ('Full Styling', 'Bath + Professional haircut, trimming & scenting.', 65.00, 'full', 90),
  ('Spa Day', 'Full Styling + Paw massage, facial & organic treats.', 90.00, 'luxury', 120)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE grooming_packages ENABLE ROW LEVEL SECURITY;

-- Verify packages were inserted
SELECT
    id,
    name,
    package_type,
    price,
    duration_minutes,
    description
FROM grooming_packages
ORDER BY price ASC;
