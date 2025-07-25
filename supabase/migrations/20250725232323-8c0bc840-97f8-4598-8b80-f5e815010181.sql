
-- First, let's create the missing payment_analytics table
CREATE TABLE IF NOT EXISTS public.payment_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id integer NOT NULL,
  venue_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payment_analytics
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_analytics
CREATE POLICY "Venue users can view their payment analytics" 
  ON public.payment_analytics 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can create payment analytics" 
  ON public.payment_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Create the expire_pending_payments function
CREATE OR REPLACE FUNCTION public.expire_pending_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update bookings that have been pending payment for more than 5 minutes
  UPDATE public.bookings 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    status = 'pending_payment' 
    AND created_at < (now() - interval '5 minutes');
    
  -- Log the cleanup action
  INSERT INTO public.payment_analytics (booking_id, venue_id, event_type, event_data)
  SELECT 
    id as booking_id,
    venue_id,
    'payment_expired' as event_type,
    jsonb_build_object('expired_at', now()) as event_data
  FROM public.bookings 
  WHERE status = 'expired' 
    AND updated_at = now();
END;
$$;

-- Create the cron job to run every minute
SELECT cron.schedule(
  'expire-pending-payments',
  '* * * * *',
  $$SELECT public.expire_pending_payments();$$
);
