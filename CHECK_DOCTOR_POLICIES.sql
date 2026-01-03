-- =====================================================
-- CHECK IF DOCTOR UPDATE POLICIES EXIST
-- =====================================================

-- Check for doctor-specific UPDATE policies
SELECT
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as has_using,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'bookings'
  AND cmd = 'UPDATE'
  AND (
    policyname LIKE '%Doctor%'
    OR policyname LIKE '%doctor%'
  )
ORDER BY policyname;

-- If the above returns empty, check ALL UPDATE policies
SELECT
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'bookings'
  AND cmd = 'UPDATE'
ORDER BY policyname;
