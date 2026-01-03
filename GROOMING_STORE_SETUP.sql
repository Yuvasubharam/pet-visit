-- =====================================================
-- GROOMING STORE SYSTEM - COMPLETE DATABASE SETUP
-- =====================================================

-- 1. Create grooming_stores table (manages store information and credentials)
CREATE TABLE IF NOT EXISTS public.grooming_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  store_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  user_id UUID NULL, -- Links to auth.users for authentication
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT grooming_stores_pkey PRIMARY KEY (id),
  CONSTRAINT grooming_stores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grooming_stores_user_id ON public.grooming_stores USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_grooming_stores_email ON public.grooming_stores USING btree (email);

-- 2. Update grooming_packages table to link with stores
ALTER TABLE public.grooming_packages
ADD COLUMN IF NOT EXISTS grooming_store_id UUID NULL,
ADD CONSTRAINT grooming_packages_store_id_fkey FOREIGN KEY (grooming_store_id)
  REFERENCES grooming_stores(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_grooming_packages_store_id ON public.grooming_packages USING btree (grooming_store_id);

-- 3. Update bookings table to link with grooming stores
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS grooming_store_id UUID NULL,
ADD CONSTRAINT bookings_grooming_store_id_fkey FOREIGN KEY (grooming_store_id)
  REFERENCES grooming_stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_grooming_store_id ON public.bookings USING btree (grooming_store_id);

-- 4. Create grooming_store_earnings table (tracks store earnings from bookings)
CREATE TABLE IF NOT EXISTS public.grooming_store_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  grooming_store_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  package_amount NUMERIC(10, 2) NOT NULL,
  platform_commission NUMERIC(10, 2) DEFAULT 0, -- Platform commission (e.g., 5%)
  net_amount NUMERIC(10, 2) NOT NULL, -- Amount store receives
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT grooming_store_earnings_pkey PRIMARY KEY (id),
  CONSTRAINT grooming_store_earnings_store_id_fkey FOREIGN KEY (grooming_store_id)
    REFERENCES grooming_stores(id) ON DELETE CASCADE,
  CONSTRAINT grooming_store_earnings_booking_id_fkey FOREIGN KEY (booking_id)
    REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT grooming_store_earnings_status_check CHECK (
    status IN ('pending', 'paid', 'cancelled')
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_grooming_store_earnings_store_id ON public.grooming_store_earnings USING btree (grooming_store_id);
CREATE INDEX IF NOT EXISTS idx_grooming_store_earnings_booking_id ON public.grooming_store_earnings USING btree (booking_id);

-- 5. Create RLS (Row Level Security) Policies for grooming_stores

-- Enable RLS on grooming_stores table
ALTER TABLE public.grooming_stores ENABLE ROW LEVEL SECURITY;

-- Policy: Grooming store owners can view their own store
CREATE POLICY "Grooming store owners can view own store"
ON public.grooming_stores
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Grooming store owners can update their own store
CREATE POLICY "Grooming store owners can update own store"
ON public.grooming_stores
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow public to view active stores (for clinic selection)
CREATE POLICY "Public can view active grooming stores"
ON public.grooming_stores
FOR SELECT
USING (is_active = true);

-- 6. Create RLS Policies for grooming_packages

-- Enable RLS on grooming_packages table
ALTER TABLE public.grooming_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active packages
CREATE POLICY "Anyone can view grooming packages"
ON public.grooming_packages
FOR SELECT
USING (true);

-- Policy: Store owners can manage their packages
CREATE POLICY "Store owners can manage own packages"
ON public.grooming_packages
FOR ALL
USING (
  grooming_store_id IN (
    SELECT id FROM grooming_stores WHERE user_id = auth.uid()
  )
);

-- 7. Create RLS Policies for bookings (grooming store access)

-- Policy: Grooming stores can view their bookings
CREATE POLICY "Grooming stores can view own bookings"
ON public.bookings
FOR SELECT
USING (
  grooming_store_id IN (
    SELECT id FROM grooming_stores WHERE user_id = auth.uid()
  )
);

-- Policy: Grooming stores can update booking status
CREATE POLICY "Grooming stores can update booking status"
ON public.bookings
FOR UPDATE
USING (
  grooming_store_id IN (
    SELECT id FROM grooming_stores WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  grooming_store_id IN (
    SELECT id FROM grooming_stores WHERE user_id = auth.uid()
  )
);

-- 8. Create RLS Policies for grooming_store_earnings

-- Enable RLS on grooming_store_earnings table
ALTER TABLE public.grooming_store_earnings ENABLE ROW LEVEL SECURITY;

-- Policy: Grooming stores can view their own earnings
CREATE POLICY "Grooming stores can view own earnings"
ON public.grooming_store_earnings
FOR SELECT
USING (
  grooming_store_id IN (
    SELECT id FROM grooming_stores WHERE user_id = auth.uid()
  )
);

-- 9. Create trigger to automatically create earnings when booking is completed

CREATE OR REPLACE FUNCTION create_grooming_store_earnings_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create earnings if:
  -- 1. Status changed to 'completed'
  -- 2. Service type is 'grooming'
  -- 3. Grooming store is assigned
  -- 4. Earnings record doesn't already exist
  IF NEW.status = 'completed'
     AND NEW.service_type = 'grooming'
     AND NEW.grooming_store_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM grooming_store_earnings
       WHERE booking_id = NEW.id
     ) THEN

    -- Calculate earnings (95% to store, 5% platform commission)
    INSERT INTO grooming_store_earnings (
      grooming_store_id,
      booking_id,
      package_amount,
      platform_commission,
      net_amount,
      status
    ) VALUES (
      NEW.grooming_store_id,
      NEW.id,
      COALESCE(NEW.payment_amount, 0),
      COALESCE(NEW.payment_amount, 0) * 0.05, -- 5% commission
      COALESCE(NEW.payment_amount, 0) * 0.95, -- 95% to store
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_create_grooming_store_earnings ON bookings;

-- Create trigger
CREATE TRIGGER trigger_create_grooming_store_earnings
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_grooming_store_earnings_on_complete();

-- 10. Insert sample grooming stores for testing

INSERT INTO public.grooming_stores (store_name, email, phone, address, city, state, pincode, latitude, longitude, is_active)
VALUES
  ('Paws & Claws Grooming', 'pawsclaws@petvisit.com', '+91-9876543210', '123 Pet Street, Near Park', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946, true),
  ('Furry Friends Spa', 'furryfriends@petvisit.com', '+91-9876543211', '456 Grooming Lane, MG Road', 'Mumbai', 'Maharashtra', '400001', 19.0760, 72.8777, true),
  ('The Pet Parlour', 'petparlour@petvisit.com', '+91-9876543212', '789 Bark Avenue, Sector 5', 'Delhi', 'Delhi', '110001', 28.7041, 77.1025, true)
ON CONFLICT (email) DO NOTHING;

-- 11. Link sample packages to stores (you'll need to update this with actual store IDs after creation)
-- This is a placeholder - run this after you know the store IDs

-- UPDATE grooming_packages
-- SET grooming_store_id = (SELECT id FROM grooming_stores WHERE email = 'pawsclaws@petvisit.com' LIMIT 1)
-- WHERE package_type IN ('basic', 'full', 'luxury');

-- 12. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.grooming_stores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.grooming_packages TO authenticated;
GRANT SELECT ON public.grooming_store_earnings TO authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- NEXT STEPS:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Create grooming store user accounts via Supabase Auth
-- 3. Link user_id to grooming_stores table
-- 4. Test the login and booking flow
