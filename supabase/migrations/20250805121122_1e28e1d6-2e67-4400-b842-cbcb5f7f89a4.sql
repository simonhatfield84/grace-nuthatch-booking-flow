
-- Phase 1: Restore payment-related columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS charge_type TEXT DEFAULT 'all_reservations',
ADD COLUMN IF NOT EXISTS charge_amount_per_guest INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_guests_for_charge INTEGER DEFAULT 1;

-- Phase 2: Recreate booking_payments table
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method_type TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate venue_stripe_settings table
CREATE TABLE IF NOT EXISTS public.venue_stripe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  webhook_endpoint_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  test_mode BOOLEAN NOT NULL DEFAULT true,
  charge_type TEXT DEFAULT 'none',
  charge_amount_per_guest INTEGER DEFAULT 0,
  minimum_guests_for_charge INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(venue_id)
);

-- Recreate payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  payment_method TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate webhook_events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  test_mode BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ DEFAULT now(),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON public.booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON public.booking_payments(status);
CREATE INDEX IF NOT EXISTS idx_booking_payments_stripe_payment_intent ON public.booking_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_venue_stripe_settings_venue_id ON public.venue_stripe_settings(venue_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_venue_id ON public.payment_transactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON public.webhook_events(stripe_event_id);

-- Phase 4: Set up RLS policies for booking_payments
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue users can view their booking payments" ON public.booking_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_payments.booking_id 
    AND b.venue_id = get_user_venue(auth.uid())
  )
);

CREATE POLICY "System can manage booking payments" ON public.booking_payments
FOR ALL USING (true);

-- Set up RLS policies for venue_stripe_settings
ALTER TABLE public.venue_stripe_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue admins can manage their stripe settings" ON public.venue_stripe_settings
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND venue_id = get_user_venue(auth.uid()) 
  AND is_admin(auth.uid(), venue_id)
);

CREATE POLICY "Venue users can view their stripe settings" ON public.venue_stripe_settings
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND venue_id = get_user_venue(auth.uid())
);

-- Set up RLS policies for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all payment transactions" ON public.payment_transactions
FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Venue users can view their payment transactions" ON public.payment_transactions
FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- Set up RLS policies for webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage webhook events" ON public.webhook_events
FOR ALL USING (true);

-- Phase 5: Create the expire_pending_payments function
CREATE OR REPLACE FUNCTION public.expire_pending_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update expired pending payments to failed
  UPDATE public.booking_payments
  SET 
    status = 'failed',
    failure_reason = 'Payment expired',
    updated_at = now()
  WHERE 
    status = 'pending' 
    AND created_at < now() - INTERVAL '1 hour';
    
  -- Update corresponding bookings to cancelled if payment failed
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE 
    id IN (
      SELECT booking_id 
      FROM public.booking_payments 
      WHERE status = 'failed' 
      AND failure_reason = 'Payment expired'
    )
    AND status = 'pending_payment';
END;
$$;
