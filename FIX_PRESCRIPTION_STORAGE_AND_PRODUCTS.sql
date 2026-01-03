-- =====================================================
-- FIX: Create Prescription Storage Bucket & Product Recommendations
-- =====================================================
-- This script will:
-- 1. Create the prescriptions storage bucket
-- 2. Set up RLS policies for prescription uploads
-- 3. Create a prescription_products table for doctor product recommendations

-- =====================================================
-- PART 1: Create Prescriptions Storage Bucket
-- =====================================================

-- Create the prescriptions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescriptions',
  'prescriptions',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

-- =====================================================
-- PART 2: Set up RLS Policies for Prescriptions Bucket
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can upload prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view prescriptions they uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view prescriptions" ON storage.objects;

-- Allow doctors to upload prescriptions for their bookings
CREATE POLICY "Doctors can upload prescriptions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'prescriptions'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- Allow doctors to update prescriptions for their bookings
CREATE POLICY "Doctors can update prescriptions" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'prescriptions'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- Allow users to view their own prescriptions
CREATE POLICY "Users can view their prescriptions" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'prescriptions'
    AND (
      -- Users can view their own prescriptions
      EXISTS (
        SELECT 1 FROM bookings
        WHERE (storage.objects.name LIKE bookings.id || '%' OR storage.objects.name LIKE '%/' || bookings.id || '/%')
          AND bookings.user_id = auth.uid()
      )
      OR
      -- Doctors can view prescriptions they uploaded
      EXISTS (
        SELECT 1 FROM bookings b
        JOIN doctors d ON d.id = b.doctor_id
        WHERE (storage.objects.name LIKE b.id || '%' OR storage.objects.name LIKE '%/' || b.id || '/%')
          AND d.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PART 3: Create Prescription Products Table
-- =====================================================

-- Create prescription_products table to store doctor's product recommendations
CREATE TABLE IF NOT EXISTS prescription_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  dosage_instructions TEXT,
  duration_days INTEGER,
  notes TEXT,
  UNIQUE(booking_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescription_products_booking_id ON prescription_products(booking_id);
CREATE INDEX IF NOT EXISTS idx_prescription_products_doctor_id ON prescription_products(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescription_products_product_id ON prescription_products(product_id);

-- =====================================================
-- PART 4: RLS Policies for Prescription Products
-- =====================================================

-- Enable RLS on prescription_products table
ALTER TABLE prescription_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can insert prescription products" ON prescription_products;
DROP POLICY IF EXISTS "Doctors can view their prescription products" ON prescription_products;
DROP POLICY IF EXISTS "Doctors can update their prescription products" ON prescription_products;
DROP POLICY IF EXISTS "Doctors can delete their prescription products" ON prescription_products;
DROP POLICY IF EXISTS "Users can view prescription products for their bookings" ON prescription_products;

-- Allow doctors to insert prescription products for their bookings
CREATE POLICY "Doctors can insert prescription products" ON prescription_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN doctors d ON d.id = b.doctor_id
      WHERE b.id = prescription_products.booking_id
        AND d.id = prescription_products.doctor_id
        AND d.user_id = auth.uid()
    )
  );

-- Allow doctors to view prescription products for their bookings
CREATE POLICY "Doctors can view their prescription products" ON prescription_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = prescription_products.doctor_id
        AND doctors.user_id = auth.uid()
    )
  );

-- Allow doctors to update prescription products for their bookings
CREATE POLICY "Doctors can update their prescription products" ON prescription_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = prescription_products.doctor_id
        AND doctors.user_id = auth.uid()
    )
  );

-- Allow doctors to delete prescription products
CREATE POLICY "Doctors can delete their prescription products" ON prescription_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = prescription_products.doctor_id
        AND doctors.user_id = auth.uid()
    )
  );

-- Allow users to view prescription products for their bookings
CREATE POLICY "Users can view prescription products for their bookings" ON prescription_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = prescription_products.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- =====================================================
-- PART 5: Success Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Successfully created prescriptions storage bucket!';
  RAISE NOTICE '✓ Successfully set up RLS policies for prescription uploads!';
  RAISE NOTICE '✓ Successfully created prescription_products table!';
  RAISE NOTICE '✓ Doctors can now upload prescriptions and recommend products!';
END
$$;
