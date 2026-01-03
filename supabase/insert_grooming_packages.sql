-- Simple script to insert grooming packages
-- Run this in Supabase SQL Editor

-- Insert default grooming packages
INSERT INTO grooming_packages (name, description, price, package_type, duration_minutes)
VALUES
  ('Standard Bath', 'Deep cleaning, drying, nail clipping & ear hygiene.', 40.00, 'basic', 45),
  ('Full Styling', 'Bath + Professional haircut, trimming & scenting.', 65.00, 'full', 90),
  ('Spa Day', 'Full Styling + Paw massage, facial & organic treats.', 90.00, 'luxury', 120)
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT * FROM grooming_packages ORDER BY price ASC;
