-- =====================================================
-- FIX: Update trigger to use correct column names
-- =====================================================
-- The trigger is using new column names but table has old schema
-- Error shows: amount column is NULL but required

-- Step 1: Check current doctor_earnings schema
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor_earnings'
AND column_name IN ('amount', 'gross_amount', 'commission', 'platform_fee', 'platform_commission', 'net_amount')
ORDER BY ordinal_position;

-- Step 2: Create trigger function that works with BOTH schemas
CREATE OR REPLACE FUNCTION create_earnings_on_complete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gross_amount DECIMAL(10, 2);
  v_platform_fee DECIMAL(10, 2);
  v_net_amount DECIMAL(10, 2);
  v_has_new_schema BOOLEAN;
BEGIN
  -- Only create earnings when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')
     AND NEW.doctor_id IS NOT NULL
     AND NEW.payment_amount IS NOT NULL THEN

    -- Calculate amounts
    v_gross_amount := NEW.payment_amount;
    v_platform_fee := NEW.payment_amount * 0.15; -- 15% platform fee
    v_net_amount := NEW.payment_amount - v_platform_fee;

    -- Check if we have the new schema (gross_amount column)
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'doctor_earnings'
      AND column_name = 'gross_amount'
    ) INTO v_has_new_schema;

    IF v_has_new_schema THEN
      -- NEW SCHEMA: Use gross_amount, platform_fee, net_amount, platform_commission
      INSERT INTO doctor_earnings (
        doctor_id,
        booking_id,
        gross_amount,
        platform_fee,
        net_amount,
        platform_commission,
        status
      ) VALUES (
        NEW.doctor_id,
        NEW.id,
        v_gross_amount,
        v_platform_fee,
        v_net_amount,
        v_platform_fee, -- platform_commission same as platform_fee for now
        'pending'
      )
      ON CONFLICT (booking_id) DO NOTHING;
    ELSE
      -- OLD SCHEMA: Use amount, commission, net_amount
      INSERT INTO doctor_earnings (
        doctor_id,
        booking_id,
        amount,
        commission,
        net_amount,
        status
      ) VALUES (
        NEW.doctor_id,
        NEW.id,
        v_gross_amount,
        v_platform_fee,
        v_net_amount,
        'pending'
      )
      ON CONFLICT (booking_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Verify the function was updated
SELECT
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  CASE
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '❌ SECURITY INVOKER'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_earnings_on_complete'
AND n.nspname = 'public';

-- Step 4: Test the trigger (dry run - check what it would insert)
SELECT
  'Test values:' as label,
  500.00 as payment_amount,
  500.00 as gross_amount,
  500.00 * 0.15 as platform_fee,
  500.00 - (500.00 * 0.15) as net_amount;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger Updated!';
  RAISE NOTICE '';
  RAISE NOTICE 'The trigger now:';
  RAISE NOTICE '1. ✓ Runs with SECURITY DEFINER (bypasses RLS)';
  RAISE NOTICE '2. ✓ Detects which schema you have';
  RAISE NOTICE '3. ✓ Uses correct column names automatically';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test now by marking a consultation as complete!';
END $$;
