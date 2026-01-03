-- =====================================================
-- FIX: Make earnings trigger bypass RLS
-- =====================================================
-- The trigger needs to insert earnings but RLS blocks it
-- Solution: Make the trigger function run with SECURITY DEFINER
-- This makes the function run with the privileges of the owner
-- (postgres/superuser) rather than the calling user

-- Step 1: Check if the trigger function exists
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_earnings_on_complete'
AND n.nspname = 'public';

-- Step 2: Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_earnings_on_complete()
RETURNS TRIGGER
SECURITY DEFINER -- This is the key change!
SET search_path = public
AS $$
DECLARE
  v_fees RECORD;
BEGIN
  -- Only create earnings when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')
     AND NEW.doctor_id IS NOT NULL
     AND NEW.payment_amount IS NOT NULL THEN

    -- Check if calculate_booking_fees function exists
    IF EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'calculate_booking_fees'
    ) THEN
      -- Calculate all fees using the function
      SELECT * INTO v_fees
      FROM calculate_booking_fees(NEW.payment_amount, NEW.doctor_id);

      -- Create doctor earnings record with new structure
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
        v_fees.doctor_gross,
        v_fees.doctor_commission,
        v_fees.doctor_net,
        v_fees.doctor_commission,
        'pending'
      )
      ON CONFLICT (booking_id) DO NOTHING;

      -- Create platform earnings record if table exists
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'platform_earnings'
      ) THEN
        INSERT INTO platform_earnings (
          booking_id,
          service_fee,
          platform_fee,
          doctor_commission,
          total_platform_income,
          doctor_gross_amount,
          doctor_commission_deducted,
          doctor_net_amount,
          commission_percentage,
          platform_fee_percentage
        ) VALUES (
          NEW.id,
          v_fees.service_fee,
          v_fees.platform_fee,
          v_fees.doctor_commission,
          v_fees.platform_total,
          v_fees.doctor_gross,
          v_fees.doctor_commission,
          v_fees.doctor_net,
          v_fees.commission_percentage,
          v_fees.platform_fee_percentage
        )
        ON CONFLICT (booking_id) DO NOTHING;
      END IF;
    ELSE
      -- Fallback to simple calculation if function doesn't exist
      DECLARE
        v_gross_amount DECIMAL(10, 2);
        v_platform_fee DECIMAL(10, 2);
        v_net_amount DECIMAL(10, 2);
      BEGIN
        v_gross_amount := NEW.payment_amount;
        v_platform_fee := NEW.payment_amount * 0.15; -- 15% platform fee
        v_net_amount := NEW.payment_amount - v_platform_fee;

        INSERT INTO doctor_earnings (
          doctor_id,
          booking_id,
          gross_amount,
          platform_fee,
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
      END;
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
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER enabled - will bypass RLS'
    ELSE '❌ SECURITY INVOKER - will fail RLS'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_earnings_on_complete'
AND n.nspname = 'public';

-- Step 4: Ensure the trigger is active
DROP TRIGGER IF EXISTS trigger_create_earnings_on_complete ON bookings;

CREATE TRIGGER trigger_create_earnings_on_complete
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_earnings_on_complete();

-- Step 5: Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_earnings_on_complete';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Earnings Trigger Fixed!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. ✓ Trigger function now runs with SECURITY DEFINER';
  RAISE NOTICE '2. ✓ This bypasses RLS policies';
  RAISE NOTICE '3. ✓ Earnings will be created automatically when booking completes';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test now:';
  RAISE NOTICE '1. Refresh your app';
  RAISE NOTICE '2. Mark a consultation as complete';
  RAISE NOTICE '3. Check browser console - should see success!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Remove manual earning creation from TypeScript code';
  RAISE NOTICE '   The trigger now handles this automatically.';
END $$;
