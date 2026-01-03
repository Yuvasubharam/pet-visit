-- =====================================================
-- ADD 'cod' TO payment_status ALLOWED VALUES
-- =====================================================
-- This migration adds 'cod' (Cash on Delivery) as an
-- allowed payment_status value for the bookings table.
-- =====================================================

-- Drop the existing constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Add the new constraint with 'cod' included
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));

-- Also update the orders table if it has the same constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Successfully added ''cod'' to payment_status allowed values!';
  RAISE NOTICE '✓ Bookings can now be marked as Cash on Delivery';
END
$$;
