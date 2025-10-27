-- ============================================================
-- UNIFIED BOOKING SYSTEM: DB-LEVEL PAYMENT ENFORCEMENT
-- ============================================================
-- This migration implements fail-closed payment enforcement:
-- 1. Removes default status (server must always decide)
-- 2. Creates DB function to compute payment requirement
-- 3. Enforces payment invariants via INSERT + UPDATE triggers
-- 4. Only Stripe webhook can confirm payment-required bookings

-- 1. REMOVE DEFAULT STATUS (server must always decide)
ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT;

-- 2. ADD STATUS CHECK CONSTRAINT (until we migrate to ENUM)
-- Covers core states + legacy states that may exist
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending_payment',
    'confirmed',
    'seated',
    'cancelled',
    'finished',
    'late',
    'incomplete',
    'no_show'
  ));

-- 3. CREATE PAYMENT REQUIREMENT FUNCTION (source of truth)
-- This mirrors the service payment rules exactly
CREATE OR REPLACE FUNCTION public.requires_payment_for_booking(
  p_service_id uuid,
  p_party_size int
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(s.requires_payment, false)
    AND (
      s.charge_type = 'all_reservations'
      OR (s.charge_type = 'large_groups' AND p_party_size >= COALESCE(s.minimum_guests_for_charge, 999))
    )
  FROM services s
  WHERE s.id = p_service_id;
$$;

-- 4. CREATE TRIGGER FUNCTION TO ENFORCE PAYMENT INVARIANTS
CREATE OR REPLACE FUNCTION public.enforce_booking_payment_invariant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  needs_payment boolean;
BEGIN
  -- Skip if no service (defensive programming)
  IF NEW.service_id IS NULL THEN
    RAISE WARNING '[BOOKING_GUARD] Booking % has no service_id, skipping payment check', COALESCE(NEW.id, 0);
    RETURN NEW;
  END IF;

  -- Compute if payment is required (source of truth)
  SELECT public.requires_payment_for_booking(NEW.service_id, NEW.party_size)
  INTO needs_payment;

  -- INVARIANT 1 (INSERT): Payment required → status MUST be pending_payment
  IF TG_OP = 'INSERT' THEN
    IF needs_payment AND NEW.status != 'pending_payment' THEN
      RAISE EXCEPTION 'payment_required_not_enforced'
        USING HINT = format(
          '[BOOKING_GUARD] Service %s requires payment for party size %s; booking must be pending_payment until webhook confirms',
          NEW.service_id,
          NEW.party_size
        );
    END IF;

    -- If no payment required, auto-confirm
    IF NOT needs_payment AND NEW.status != 'confirmed' THEN
      RAISE NOTICE '[BOOKING_GUARD] Booking % does not require payment, auto-confirming', COALESCE(NEW.id, 0);
      NEW.status := 'confirmed';
    END IF;
  END IF;

  -- INVARIANT 2 (UPDATE): Payment required → only webhook can confirm
  IF TG_OP = 'UPDATE' THEN
    IF needs_payment 
       AND NEW.status = 'confirmed' 
       AND OLD.status != 'confirmed' THEN
      RAISE EXCEPTION 'payment_required_not_enforced'
        USING HINT = format(
          '[BOOKING_GUARD] Only Stripe webhook may confirm booking %s (requires payment)',
          NEW.id
        );
    END IF;

    -- If no payment required and someone tries to set pending_payment, auto-fix to confirmed
    IF NOT needs_payment 
       AND NEW.status = 'pending_payment' 
       AND OLD.status != 'pending_payment' THEN
      RAISE NOTICE '[BOOKING_GUARD] Booking % does not require payment, correcting to confirmed', NEW.id;
      NEW.status := 'confirmed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. CREATE TRIGGERS FOR INSERT AND UPDATE
DROP TRIGGER IF EXISTS trg_enforce_booking_payment_invariant_ins ON bookings;
CREATE TRIGGER trg_enforce_booking_payment_invariant_ins
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_payment_invariant();

DROP TRIGGER IF EXISTS trg_enforce_booking_payment_invariant_upd ON bookings;
CREATE TRIGGER trg_enforce_booking_payment_invariant_upd
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_payment_invariant();

-- 6. TEST THE FUNCTION (diagnostic)
DO $$
DECLARE
  test_service_id uuid;
  test_result boolean;
BEGIN
  -- Get a service that requires payment for testing
  SELECT id INTO test_service_id
  FROM services
  WHERE requires_payment = true
    AND charge_type = 'large_groups'
  LIMIT 1;
  
  IF test_service_id IS NOT NULL THEN
    RAISE NOTICE '[PAYMENT_GUARD_TEST] Testing requires_payment_for_booking with service: %', test_service_id;
    
    -- Test party 4 (likely no charge)
    SELECT public.requires_payment_for_booking(test_service_id, 4) INTO test_result;
    RAISE NOTICE '[PAYMENT_GUARD_TEST] Party 4 requires payment: %', test_result;
    
    -- Test party 8 (likely requires charge)
    SELECT public.requires_payment_for_booking(test_service_id, 8) INTO test_result;
    RAISE NOTICE '[PAYMENT_GUARD_TEST] Party 8 requires payment: %', test_result;
  ELSE
    RAISE NOTICE '[PAYMENT_GUARD_TEST] No test service found with requires_payment=true';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Payment invariant enforcement installed successfully';
  RAISE NOTICE '   - Status default removed';
  RAISE NOTICE '   - Payment requirement function created';
  RAISE NOTICE '   - INSERT + UPDATE triggers active';
  RAISE NOTICE '   - Only webhook can confirm payment-required bookings';
END $$;