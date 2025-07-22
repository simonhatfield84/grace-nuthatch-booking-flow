
-- Add new booking statuses for payment failures
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'finished', 'no_show', 'pending_payment', 'payment_failed', 'expired'));

-- Add cancellation reason and payment timeout tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_timeout_at TIMESTAMP WITH TIME ZONE;

-- Create payment analytics table for conversion tracking
CREATE TABLE IF NOT EXISTS public.payment_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'payment_initiated', 'payment_completed', 'payment_failed', 'payment_expired'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for payment analytics
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue users can view their payment analytics" 
  ON public.payment_analytics 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can create payment analytics" 
  ON public.payment_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to handle payment timeouts
CREATE OR REPLACE FUNCTION public.expire_pending_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update bookings that have been pending payment for more than 5 minutes
  UPDATE public.bookings 
  SET 
    status = 'expired',
    cancellation_reason = 'payment_timeout',
    payment_timeout_at = NOW(),
    updated_at = NOW()
  WHERE status = 'pending_payment' 
    AND created_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log analytics for expired bookings
  INSERT INTO public.payment_analytics (booking_id, venue_id, event_type, event_data)
  SELECT 
    id,
    venue_id,
    'payment_expired',
    jsonb_build_object(
      'timeout_minutes', EXTRACT(EPOCH FROM (NOW() - created_at)) / 60,
      'party_size', party_size,
      'service', service
    )
  FROM public.bookings 
  WHERE status = 'expired' 
    AND payment_timeout_at >= NOW() - INTERVAL '1 minute';
  
  RETURN expired_count;
END;
$$;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the payment cleanup to run every minute
SELECT cron.schedule(
  'expire-pending-payments',
  '* * * * *', -- every minute
  'SELECT public.expire_pending_payments();'
);
