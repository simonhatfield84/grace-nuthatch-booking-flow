
-- Add new booking status values for payment system
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'incomplete'; 
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_expired';

-- Create payment_requests table to track email payment links
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER NOT NULL,
  venue_id UUID NOT NULL,
  payment_link TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_requests
CREATE POLICY "Venue users can view their payment requests" 
  ON public.payment_requests FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can manage payment requests" 
  ON public.payment_requests FOR ALL 
  USING (true);

-- Add refund tracking columns to booking_payments
ALTER TABLE public.booking_payments 
ADD COLUMN IF NOT EXISTS refund_amount_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- Add service-level refund window settings
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS refund_window_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS auto_refund_enabled BOOLEAN DEFAULT false;

-- Update venue_stripe_settings with additional fields
ALTER TABLE public.venue_stripe_settings 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS live_webhook_secret TEXT;

-- Create payment analytics view
CREATE OR REPLACE VIEW public.payment_analytics AS
SELECT 
  bp.id,
  bp.booking_id,
  b.venue_id,
  bp.amount_cents,
  bp.status,
  bp.refund_amount_cents,
  bp.refund_status,
  bp.created_at as payment_date,
  bp.refunded_at,
  b.booking_date,
  b.guest_name,
  b.party_size,
  s.title as service_name
FROM public.booking_payments bp
JOIN public.bookings b ON bp.booking_id = b.id
LEFT JOIN public.services s ON b.service = s.id::text;

-- Create function to automatically expire pending payments
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update bookings that have been pending payment for over 24 hours
  UPDATE public.bookings
  SET 
    status = 'incomplete',
    updated_at = now()
  WHERE 
    status = 'pending_payment' 
    AND created_at < now() - interval '24 hours';
    
  -- Update corresponding payment requests
  UPDATE public.payment_requests
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    expires_at < now() 
    AND status = 'sent';
END;
$$;

-- Create function to send payment reminders
CREATE OR REPLACE FUNCTION public.mark_reminder_sent(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.payment_requests
  SET 
    reminder_sent_at = now(),
    updated_at = now()
  WHERE id = request_id;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_booking_id ON public.payment_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_expires_at ON public.payment_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_payments_refund_status ON public.booking_payments(refund_status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_venue ON public.bookings(status, venue_id);
