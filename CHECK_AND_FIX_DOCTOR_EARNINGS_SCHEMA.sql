-- =====================================================
-- CHECK AND FIX: doctor_earnings table schema
-- =====================================================

-- Step 1: Check the current schema of doctor_earnings
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'doctor_earnings'
ORDER BY ordinal_position;

-- Step 2: Check what columns the trigger is trying to insert
-- From the error, we see the trigger is inserting:
-- gross_amount, platform_fee, net_amount, platform_commission
-- But the table expects: amount, commission, net_amount

-- The issue is there are TWO different schemas:
-- OLD schema: amount, commission, net_amount
-- NEW schema: gross_amount, platform_fee, net_amount, platform_commission

-- Let's check which one we actually have
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'doctor_earnings' AND column_name = 'amount'
    ) THEN 'OLD SCHEMA (has amount column)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'doctor_earnings' AND column_name = 'gross_amount'
    ) THEN 'NEW SCHEMA (has gross_amount column)'
    ELSE 'UNKNOWN SCHEMA'
  END as schema_type;

-- Step 3: Fix the schema - make amount nullable or add gross_amount
-- Option A: If using OLD schema, make amount nullable
ALTER TABLE doctor_earnings
ALTER COLUMN amount DROP NOT NULL;

-- Option B: If using NEW schema but amount column exists, drop it
-- (Commented out for safety - only run if needed)
-- ALTER TABLE doctor_earnings DROP COLUMN IF EXISTS amount;

-- Step 4: Ensure we have the correct columns for the NEW schema
ALTER TABLE doctor_earnings
ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10, 2);

-- Step 5: Migrate data from old columns to new columns if needed
UPDATE doctor_earnings
SET gross_amount = amount
WHERE gross_amount IS NULL AND amount IS NOT NULL;

-- Step 6: Check the updated schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'doctor_earnings'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Schema check complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Review the schema output above and run the appropriate fix.';
END $$;
