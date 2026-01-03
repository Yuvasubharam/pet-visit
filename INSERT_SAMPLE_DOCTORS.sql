-- ============================================
-- Insert Sample Doctors and Availability Data
-- ============================================
-- Run this in Supabase SQL Editor to populate test data

-- Note: You'll need to replace 'YOUR_USER_ID_HERE' with actual auth user IDs
-- Or you can create doctors without user_id and set approval to 'approved' manually

-- ============================================
-- STEP 1: Insert Sample Doctors
-- ============================================

-- Insert sample doctors (you can register these via the app, or insert directly)
-- These are sample entries - adjust as needed

INSERT INTO public.doctors (
  id,
  full_name,
  email,
  phone,
  specialization,
  clinic_address,
  is_verified,
  is_active,
  approval,
  rating,
  total_consultations
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Dr. Sarah Johnson',
    'sarah.johnson@vetclinic.com',
    '+1-555-0101',
    'General Veterinary Medicine',
    '123 Pet Care Lane, Animal City, AC 12345',
    true,
    true,
    'approved',
    4.8,
    150
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Dr. Michael Chen',
    'michael.chen@vetclinic.com',
    '+1-555-0102',
    'Veterinary Surgery',
    '456 Animal Hospital Rd, Pet Town, PT 67890',
    true,
    true,
    'approved',
    4.9,
    200
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Dr. Emily Rodriguez',
    'emily.rodriguez@vetclinic.com',
    '+1-555-0103',
    'Emergency & Critical Care',
    '789 Rescue Street, Care City, CC 54321',
    true,
    true,
    'approved',
    4.7,
    180
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Insert Availability Slots for Next 7 Days
-- ============================================

-- This will create availability for all three doctors for the next 7 days
-- Adjust dates as needed (using relative dates from today)

DO $$
DECLARE
  doctor_ids UUID[] := ARRAY[
    '11111111-1111-1111-1111-111111111111'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID
  ];
  doctor_id UUID;
  day_offset INT;
  current_date_str TEXT;
  slot_types TEXT[] := ARRAY['online', 'home', 'clinic'];
  slot_type TEXT;
  time_slots TEXT[][] := ARRAY[
    ARRAY['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    ARRAY['14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
  ];
  morning_slots TEXT[];
  afternoon_slots TEXT[];
  time_slot TEXT;
  end_time_str TEXT;
  hour_part INT;
  minute_part INT;
BEGIN
  morning_slots := time_slots[1];
  afternoon_slots := time_slots[2];

  -- Loop through each doctor
  FOREACH doctor_id IN ARRAY doctor_ids
  LOOP
    -- Loop through next 7 days
    FOR day_offset IN 0..6 LOOP
      current_date_str := TO_CHAR(CURRENT_DATE + day_offset, 'YYYY-MM-DD');

      -- Loop through each slot type (online, home, clinic)
      FOREACH slot_type IN ARRAY slot_types
      LOOP
        -- Insert morning slots
        FOREACH time_slot IN ARRAY morning_slots
        LOOP
          -- Calculate end time (30 minutes later)
          hour_part := SPLIT_PART(time_slot, ':', 1)::INT;
          minute_part := SPLIT_PART(time_slot, ':', 2)::INT + 30;

          IF minute_part >= 60 THEN
            hour_part := hour_part + 1;
            minute_part := minute_part - 60;
          END IF;

          end_time_str := LPAD(hour_part::TEXT, 2, '0') || ':' || LPAD(minute_part::TEXT, 2, '0');

          INSERT INTO public.doctor_availability (
            doctor_id,
            date,
            start_time,
            end_time,
            slot_type,
            capacity,
            booked_count,
            is_active
          ) VALUES (
            doctor_id,
            current_date_str,
            time_slot,
            end_time_str,
            slot_type,
            CASE
              WHEN slot_type = 'online' THEN 5
              WHEN slot_type = 'clinic' THEN 3
              ELSE 2
            END,
            0,
            true
          )
          ON CONFLICT (doctor_id, date, start_time, slot_type) DO NOTHING;
        END LOOP;

        -- Insert afternoon slots
        FOREACH time_slot IN ARRAY afternoon_slots
        LOOP
          -- Calculate end time (30 minutes later)
          hour_part := SPLIT_PART(time_slot, ':', 1)::INT;
          minute_part := SPLIT_PART(time_slot, ':', 2)::INT + 30;

          IF minute_part >= 60 THEN
            hour_part := hour_part + 1;
            minute_part := minute_part - 60;
          END IF;

          end_time_str := LPAD(hour_part::TEXT, 2, '0') || ':' || LPAD(minute_part::TEXT, 2, '0');

          INSERT INTO public.doctor_availability (
            doctor_id,
            date,
            start_time,
            end_time,
            slot_type,
            capacity,
            booked_count,
            is_active
          ) VALUES (
            doctor_id,
            current_date_str,
            time_slot,
            end_time_str,
            slot_type,
            CASE
              WHEN slot_type = 'online' THEN 5
              WHEN slot_type = 'clinic' THEN 3
              ELSE 2
            END,
            0,
            true
          )
          ON CONFLICT (doctor_id, date, start_time, slot_type) DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check inserted doctors
SELECT
  id,
  full_name,
  email,
  specialization,
  is_active,
  approval,
  rating,
  total_consultations
FROM public.doctors
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ORDER BY full_name;

-- Check availability slots
SELECT
  d.full_name,
  da.date,
  da.slot_type,
  COUNT(*) as slot_count,
  SUM(da.capacity) as total_capacity
FROM public.doctor_availability da
JOIN public.doctors d ON d.id = da.doctor_id
WHERE da.date >= CURRENT_DATE
GROUP BY d.full_name, da.date, da.slot_type
ORDER BY d.full_name, da.date, da.slot_type;

-- Check today's availability
SELECT
  d.full_name,
  da.slot_type,
  da.start_time,
  da.end_time,
  da.capacity,
  da.booked_count
FROM public.doctor_availability da
JOIN public.doctors d ON d.id = da.doctor_id
WHERE da.date = CURRENT_DATE
  AND da.is_active = true
ORDER BY d.full_name, da.slot_type, da.start_time;
