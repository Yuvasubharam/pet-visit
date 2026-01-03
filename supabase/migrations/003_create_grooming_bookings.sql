-- Create grooming_bookings table
-- This extends the bookings table with grooming-specific fields

-- Add grooming-specific columns to bookings table if needed
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS package_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);

-- Create grooming_packages table for package details
CREATE TABLE IF NOT EXISTS grooming_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  package_type VARCHAR(50) NOT NULL, -- 'basic', 'full', 'luxury'
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default grooming packages
INSERT INTO grooming_packages (name, description, price, package_type, duration_minutes)
VALUES
  ('Standard Bath', 'Deep cleaning, drying, nail clipping & ear hygiene.', 40.00, 'basic', 45),
  ('Full Styling', 'Bath + Professional haircut, trimming & scenting.', 65.00, 'full', 90),
  ('Spa Day', 'Full Styling + Paw massage, facial & organic treats.', 90.00, 'luxury', 120)
ON CONFLICT DO NOTHING;

-- Add foreign key for grooming package in bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS grooming_package_id UUID REFERENCES grooming_packages(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Add RLS policies for grooming_packages (public read access)
ALTER TABLE grooming_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to grooming packages"
ON grooming_packages FOR SELECT
TO authenticated
USING (true);

-- Comments for documentation
COMMENT ON TABLE grooming_packages IS 'Stores grooming service packages with pricing and details';
COMMENT ON COLUMN bookings.package_type IS 'Type of grooming package: basic, full, or luxury';
COMMENT ON COLUMN bookings.contact_number IS 'Contact number for the booking';
COMMENT ON COLUMN bookings.grooming_package_id IS 'Reference to grooming package selected';
