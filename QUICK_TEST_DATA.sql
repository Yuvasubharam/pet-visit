-- ============================================
-- QUICK TEST DATA - Run this for immediate testing
-- ============================================
-- This creates minimal test data so you can test doctor loading immediately

-- Delete existing test data (optional - comment out if you want to keep existing data)
DELETE FROM doctor_availability
WHERE doctor_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

DELETE FROM doctors
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Insert 3 approved doctors
INSERT INTO doctors (
  id, full_name, email, phone, specialization, clinic_address,
  is_verified, is_active, approval, rating, total_consultations
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Dr. Sarah Johnson',
    'sarah.johnson@test.com',
    '+1-555-0101',
    'General Veterinary',
    '123 Pet Care Lane, Animal City',
    true, true, 'approved', 4.8, 150
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Dr. Michael Chen',
    'michael.chen@test.com',
    '+1-555-0102',
    'Surgery Specialist',
    '456 Animal Hospital Rd, Pet Town',
    true, true, 'approved', 4.9, 200
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Dr. Emily Rodriguez',
    'emily.rodriguez@test.com',
    '+1-555-0103',
    'Emergency Care',
    '789 Rescue Street, Care City',
    true, true, 'approved', 4.7, 180
  );

-- Insert TODAY's availability for all doctors (all slot types)
-- This ensures you see doctors immediately when testing

INSERT INTO doctor_availability (doctor_id, date, start_time, end_time, slot_type, capacity, booked_count, is_active)
SELECT
  doctor_id,
  CURRENT_DATE::TEXT as date,
  start_time,
  end_time,
  slot_type,
  CASE
    WHEN slot_type = 'online' THEN 5
    WHEN slot_type = 'clinic' THEN 3
    ELSE 2
  END as capacity,
  0 as booked_count,
  true as is_active
FROM (
  SELECT unnest(ARRAY[
    '11111111-1111-1111-1111-111111111111'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID
  ]) as doctor_id
) doctors
CROSS JOIN (
  SELECT unnest(ARRAY['online', 'home', 'clinic']) as slot_type
) types
CROSS JOIN (
  VALUES
    ('09:00', '09:30'),
    ('09:30', '10:00'),
    ('10:00', '10:30'),
    ('10:30', '11:00'),
    ('11:00', '11:30'),
    ('11:30', '12:00'),
    ('14:00', '14:30'),
    ('14:30', '15:00'),
    ('15:00', '15:30'),
    ('15:30', '16:00'),
    ('16:00', '16:30'),
    ('16:30', '17:00')
) times(start_time, end_time)
ON CONFLICT (doctor_id, date, start_time, slot_type) DO NOTHING;

-- Insert TOMORROW's availability
INSERT INTO doctor_availability (doctor_id, date, start_time, end_time, slot_type, capacity, booked_count, is_active)
SELECT
  doctor_id,
  (CURRENT_DATE + INTERVAL '1 day')::DATE::TEXT as date,
  start_time,
  end_time,
  slot_type,
  CASE
    WHEN slot_type = 'online' THEN 5
    WHEN slot_type = 'clinic' THEN 3
    ELSE 2
  END as capacity,
  0 as booked_count,
  true as is_active
FROM (
  SELECT unnest(ARRAY[
    '11111111-1111-1111-1111-111111111111'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID
  ]) as doctor_id
) doctors
CROSS JOIN (
  SELECT unnest(ARRAY['online', 'home', 'clinic']) as slot_type
) types
CROSS JOIN (
  VALUES
    ('09:00', '09:30'),
    ('09:30', '10:00'),
    ('10:00', '10:30'),
    ('10:30', '11:00'),
    ('11:00', '11:30'),
    ('11:30', '12:00'),
    ('14:00', '14:30'),
    ('14:30', '15:00'),
    ('15:00', '15:30'),
    ('15:30', '16:00'),
    ('16:00', '16:30'),
    ('16:30', '17:00')
) times(start_time, end_time)
ON CONFLICT (doctor_id, date, start_time, slot_type) DO NOTHING;

-- Verify the data
SELECT
  'Doctors Created' as check_type,
  COUNT(*) as count
FROM doctors
WHERE is_active = true AND approval = 'approved'

UNION ALL

SELECT
  'Availability Slots Created' as check_type,
  COUNT(*) as count
FROM doctor_availability
WHERE date >= CURRENT_DATE::TEXT AND is_active = true;

-- Show sample data
SELECT
  d.full_name,
  da.date,
  da.slot_type,
  COUNT(*) as time_slots
FROM doctor_availability da
JOIN doctors d ON d.id = da.doctor_id
WHERE da.date >= CURRENT_DATE::TEXT
GROUP BY d.full_name, da.date, da.slot_type
ORDER BY da.date, d.full_name, da.slot_type;
