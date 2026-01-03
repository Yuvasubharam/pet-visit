-- =====================================================
-- Grooming Setup Verification Script
-- Run this in Supabase SQL Editor to check the setup
-- =====================================================

-- 1. Check if grooming_packages table exists and has data
SELECT
    'Grooming Packages Table' as check_name,
    COUNT(*) as total_packages,
    COALESCE(SUM(CASE WHEN package_type = 'basic' THEN 1 ELSE 0 END), 0) as basic_packages,
    COALESCE(SUM(CASE WHEN package_type = 'full' THEN 1 ELSE 0 END), 0) as full_packages,
    COALESCE(SUM(CASE WHEN package_type = 'luxury' THEN 1 ELSE 0 END), 0) as luxury_packages
FROM grooming_packages;

-- 2. Display all grooming packages with details
SELECT
    id,
    name,
    package_type,
    price,
    duration_minutes,
    description,
    created_at
FROM grooming_packages
ORDER BY price ASC;

-- 3. Check if bookings table has grooming columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
    AND column_name IN ('package_type', 'contact_number', 'grooming_package_id', 'service_type')
ORDER BY column_name;

-- 4. Check existing grooming bookings
SELECT
    COUNT(*) as total_grooming_bookings,
    COALESCE(SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END), 0) as upcoming_bookings,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_bookings,
    COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_bookings
FROM bookings
WHERE service_type = 'grooming';

-- 5. Display recent grooming bookings with details
SELECT
    b.id,
    b.created_at,
    b.date,
    b.time,
    b.booking_type,
    b.status,
    b.payment_status,
    b.payment_amount,
    gp.name as package_name,
    gp.package_type,
    p.name as pet_name,
    p.species as pet_species
FROM bookings b
LEFT JOIN grooming_packages gp ON b.grooming_package_id = gp.id
LEFT JOIN pets p ON b.pet_id = p.id
WHERE b.service_type = 'grooming'
ORDER BY b.created_at DESC
LIMIT 10;

-- 6. Check RLS policies for grooming_packages
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'grooming_packages';

-- 7. Check indexes on bookings table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
    AND indexname LIKE '%grooming%' OR indexname LIKE '%service_type%' OR indexname LIKE '%user_date%'
ORDER BY indexname;
