-- =====================================================
-- VERIFY CURRENT BOOKINGS RLS POLICIES
-- =====================================================
-- Run this to check what policies currently exist
-- =====================================================

-- List ALL policies for bookings table
SELECT
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY cmd, policyname;

-- Count policies by type
SELECT
  cmd as operation,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'bookings'
GROUP BY cmd
ORDER BY cmd;
