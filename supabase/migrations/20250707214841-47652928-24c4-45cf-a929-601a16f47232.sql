
-- Create venue Stripe settings table
CREATE TABLE public.venue_stripe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  webhook_endpoint_secret TEXT,
  is_active BOOLEAN DEFAULT false,
  charge_type TEXT DEFAULT 'none' CHECK (charge_type IN ('none', 'all_reservations', 'large_groups')),
  minimum_guests_for_charge INTEGER,
  charge_amount_per_guest INTEGER DEFAULT 0,
  test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id)
);

-- Create booking payments tracking table
CREATE TABLE public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  payment_method_type TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id)
);

-- Add payment settings to services table
ALTER TABLE public.services ADD COLUMN requires_payment BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN charge_type TEXT DEFAULT 'venue_default' CHECK (charge_type IN ('venue_default', 'all_reservations', 'large_groups'));
ALTER TABLE public.services ADD COLUMN minimum_guests_for_charge INTEGER;
ALTER TABLE public.services ADD COLUMN charge_amount_per_guest INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.venue_stripe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for venue_stripe_settings
CREATE POLICY "Venue admins can manage their stripe settings" ON public.venue_stripe_settings
  FOR ALL USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

CREATE POLICY "Venue users can view their stripe settings" ON public.venue_stripe_settings
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- RLS policies for booking_payments
CREATE POLICY "Venue users can view their booking payments" ON public.booking_payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_payments.booking_id 
    AND b.venue_id = get_user_venue(auth.uid())
  ));

CREATE POLICY "Venue admins can manage booking payments" ON public.booking_payments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_payments.booking_id 
    AND b.venue_id = get_user_venue(auth.uid())
    AND is_admin(auth.uid(), b.venue_id)
  ));

-- Public can create booking payments (for checkout process)
CREATE POLICY "Public can create booking payments" ON public.booking_payments
  FOR INSERT WITH CHECK (true);
