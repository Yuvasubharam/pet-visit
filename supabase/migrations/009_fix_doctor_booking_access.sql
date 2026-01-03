-- Fix RLS policies to allow doctors to view pet and user information for their bookings

-- Allow doctors to view pets for bookings assigned to them
CREATE POLICY "Doctors can view pets for their bookings" ON pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN doctors d ON d.id = b.doctor_id
      WHERE b.pet_id = pets.id
        AND d.user_id = auth.uid()
    )
  );

-- Allow doctors to view user information for their bookings
CREATE POLICY "Doctors can view users for their bookings" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN doctors d ON d.id = b.doctor_id
      WHERE b.user_id = users.id
        AND d.user_id = auth.uid()
    )
  );

-- Allow doctors to view addresses for their bookings
CREATE POLICY "Doctors can view addresses for their bookings" ON addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN doctors d ON d.id = b.doctor_id
      WHERE b.address_id = addresses.id
        AND d.user_id = auth.uid()
    )
  );

-- Also allow doctors to view bookings that are unassigned (doctor_id IS NULL)
-- so they can see new booking requests
CREATE POLICY "Doctors can view unassigned bookings" ON bookings
  FOR SELECT USING (
    doctor_id IS NULL
    AND service_type = 'consultation'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.user_id = auth.uid()
    )
  );
