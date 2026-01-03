-- Fix doctor_earnings Table Schema
-- Problem: Table has 'amount' and 'commission' columns
-- But code expects 'gross_amount' and 'platform_fee' columns

-- Step 1: Add new columns if they don't exist
ALTER TABLE doctor_earnings
ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10, 2);

ALTER TABLE doctor_earnings
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2);

-- Step 2: Migrate data from old columns to new columns (if old columns have data)
UPDATE doctor_earnings
SET gross_amount = amount,
    platform_fee = commission
WHERE gross_amount IS NULL
  AND amount IS NOT NULL;

-- Step 3: For records where net_amount exists but gross_amount doesn't, calculate it
-- Assuming platform_fee is 15% of gross_amount: gross_amount = net_amount / 0.85
UPDATE doctor_earnings
SET gross_amount = net_amount / 0.85,
    platform_fee = (net_amount / 0.85) * 0.15
WHERE gross_amount IS NULL
  AND net_amount IS NOT NULL;

-- Step 4: Make the new columns NOT NULL (after migration)
-- Note: Only uncomment this after verifying all data has been migrated
-- ALTER TABLE doctor_earnings ALTER COLUMN gross_amount SET NOT NULL;
-- ALTER TABLE doctor_earnings ALTER COLUMN platform_fee SET NOT NULL;

-- Step 5: Optionally drop old columns (be careful - only do this after confirming migration)
-- Note: Keep commented until you're absolutely sure old columns aren't needed
-- ALTER TABLE doctor_earnings DROP COLUMN IF EXISTS amount;
-- ALTER TABLE doctor_earnings DROP COLUMN IF EXISTS commission;

-- Step 6: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_doctor_earnings_booking_id
ON doctor_earnings(booking_id);

-- Step 7: Add unique constraint to prevent duplicate earnings for same booking
-- Note: This will fail if there are already duplicates. Check first!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_earning_per_booking'
  ) THEN
    ALTER TABLE doctor_earnings
    ADD CONSTRAINT unique_earning_per_booking
    UNIQUE (booking_id);
  END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor_earnings'
ORDER BY ordinal_position;
