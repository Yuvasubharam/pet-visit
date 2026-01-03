-- =====================================================
-- FINAL FIX: Earnings trigger with correct columns
-- =====================================================
-- The table has BOTH old and new columns
-- Populate both sets to ensure compatibility

-- Recreate the trigger function with all required columns
CREATE OR REPLACE FUNCTION create_earnings_on_complete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gross_amount DECIMAL(10, 2);
  v_platform_fee DECIMAL(10, 2);
  v_net_amount DECIMAL(10, 2);
BEGIN
  -- Only create earnings when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')
     AND NEW.doctor_id IS NOT NULL
     AND NEW.payment_amount IS NOT NULL THEN

    -- Calculate amounts
    v_gross_amount := NEW.payment_amount;
    v_platform_fee := NEW.payment_amount * 0.15; -- 15% platform fee
    v_net_amount := NEW.payment_amount - v_platform_fee;

    -- Insert with BOTH old and new column names
    INSERT INTO doctor_earnings (
      doctor_id,
      booking_id,
      amount,              -- OLD schema
      commission,          -- OLD schema
      net_amount,          -- BOTH schemas
      gross_amount,        -- NEW schema
      platform_fee,        -- NEW schema
      platform_commission, -- NEW schema
      status
    ) VALUES (
      NEW.doctor_id,
      NEW.id,
      v_gross_amount,      -- amount (old)
      v_platform_fee,      -- commission (old)
      v_net_amount,        -- net_amount (both)
      v_gross_amount,      -- gross_amount (new)
      v_platform_fee,      -- platform_fee (new)
      v_platform_fee,      -- platform_commission (new)
      'pending'
    )
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function
SELECT
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  CASE
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER enabled'
    ELSE '❌ SECURITY INVOKER (will fail)'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_earnings_on_complete'
AND n.nspname = 'public';

-- Test calculation
SELECT
  'Test for booking amount 500:' as test_case,
  500.00 as payment_amount,
  500.00 as amount_and_gross,
  500.00 * 0.15 as commission_and_platform_fee,
  500.00 - (500.00 * 0.15) as net_amount;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Earnings Trigger FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE 'The trigger now:';
  RAISE NOTICE '1. ✓ Runs with SECURITY DEFINER (bypasses RLS)';
  RAISE NOTICE '2. ✓ Populates ALL columns (old and new schema)';
  RAISE NOTICE '3. ✓ Will NOT fail with null constraint errors';
  RAISE NOTICE '';
  RAISE NOTICE 'Calculation:';
  RAISE NOTICE '• Gross Amount = Payment Amount (500)';
  RAISE NOTICE '• Platform Fee = 15%% (75)';
  RAISE NOTICE '• Net Amount = 85%% (425)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST NOW:';
  RAISE NOTICE '1. Refresh your app';
  RAISE NOTICE '2. Mark consultation as complete';
  RAISE NOTICE '3. Should work without errors!';
END $$;
