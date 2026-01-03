-- Doctor Consultation System Tables

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  specialization TEXT NOT NULL,
  clinic_address TEXT,
  profile_photo_url TEXT,
  credentials_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0
);

-- Doctor availability slots table
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('clinic', 'home', 'online')),
  capacity INTEGER NOT NULL DEFAULT 1,
  booked_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(doctor_id, date, start_time, slot_type)
);

-- Doctor consultation bookings (extends existing bookings table functionality)
-- We'll use the existing bookings table and add doctor_id reference
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consultation_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call_link TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prescription_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Doctor earnings/analytics table
CREATE TABLE IF NOT EXISTS doctor_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  commission DECIMAL DEFAULT 0,
  net_amount DECIMAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ
);

-- Patient reviews for doctors
CREATE TABLE IF NOT EXISTS doctor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  UNIQUE(booking_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_date ON doctor_availability(date);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_slot_type ON doctor_availability(slot_type);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor_id ON bookings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_earnings_doctor_id ON doctor_earnings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Doctors policies
CREATE POLICY "Doctors can view own profile" ON doctors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile" ON doctors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own profile" ON doctors
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view active doctors" ON doctors
  FOR SELECT USING (is_active = TRUE AND is_verified = TRUE);

-- Doctor availability policies
CREATE POLICY "Doctors can view own availability" ON doctor_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = doctor_availability.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert own availability" ON doctor_availability
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = doctor_availability.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update own availability" ON doctor_availability
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = doctor_availability.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete own availability" ON doctor_availability
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = doctor_availability.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active availability" ON doctor_availability
  FOR SELECT USING (is_active = TRUE);

-- Update existing bookings policies to include doctor access
CREATE POLICY "Doctors can view their bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = bookings.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their booking details" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = bookings.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- Doctor earnings policies
CREATE POLICY "Doctors can view own earnings" ON doctor_earnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = doctor_earnings.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- Doctor reviews policies
CREATE POLICY "Anyone can view reviews" ON doctor_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews for their bookings" ON doctor_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = doctor_reviews.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reviews" ON doctor_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON doctor_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update doctor stats after a booking
CREATE OR REPLACE FUNCTION update_doctor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment total consultations
    UPDATE doctors
    SET total_consultations = total_consultations + 1
    WHERE id = NEW.doctor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update doctor stats
DROP TRIGGER IF EXISTS trigger_update_doctor_stats ON bookings;
CREATE TRIGGER trigger_update_doctor_stats
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.doctor_id IS NOT NULL)
  EXECUTE FUNCTION update_doctor_stats();

-- Function to update doctor rating after review
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctors
  SET rating = (
    SELECT AVG(rating)::DECIMAL
    FROM doctor_reviews
    WHERE doctor_id = NEW.doctor_id
  )
  WHERE id = NEW.doctor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update doctor rating
DROP TRIGGER IF EXISTS trigger_update_doctor_rating ON doctor_reviews;
CREATE TRIGGER trigger_update_doctor_rating
  AFTER INSERT OR UPDATE ON doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_rating();

-- Function to update availability booked count
CREATE OR REPLACE FUNCTION update_availability_count()
RETURNS TRIGGER AS $$
DECLARE
  slot_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Find matching availability slot
    SELECT * INTO slot_record
    FROM doctor_availability
    WHERE doctor_id = NEW.doctor_id
      AND date = NEW.date
      AND NEW.time >= start_time
      AND NEW.time < end_time
      AND slot_type = NEW.booking_type
    LIMIT 1;

    IF FOUND THEN
      UPDATE doctor_availability
      SET booked_count = booked_count + 1
      WHERE id = slot_record.id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Find matching availability slot
    SELECT * INTO slot_record
    FROM doctor_availability
    WHERE doctor_id = OLD.doctor_id
      AND date = OLD.date
      AND OLD.time >= start_time
      AND OLD.time < end_time
      AND slot_type = OLD.booking_type
    LIMIT 1;

    IF FOUND THEN
      UPDATE doctor_availability
      SET booked_count = GREATEST(booked_count - 1, 0)
      WHERE id = slot_record.id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update availability count
DROP TRIGGER IF EXISTS trigger_update_availability_count ON bookings;
CREATE TRIGGER trigger_update_availability_count
  AFTER INSERT OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_count();
