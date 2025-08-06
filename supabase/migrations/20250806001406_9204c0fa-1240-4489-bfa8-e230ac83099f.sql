
-- Phase 1: Database State Reconciliation

-- Add the missing processed_at column to booking_payments table
ALTER TABLE public.booking_payments 
ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone;

-- Update existing successful payments to have a processed_at timestamp
UPDATE public.booking_payments 
SET processed_at = updated_at 
WHERE status = 'succeeded' AND processed_at IS NULL;

-- Create webhook_events table to track all webhook processing
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  venue_id uuid REFERENCES public.venues(id),
  booking_id integer REFERENCES public.bookings(id),
  processed_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'processed',
  error_message text,
  raw_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy for system to manage webhook events
CREATE POLICY "System can manage webhook events" ON public.webhook_events
FOR ALL USING (true);

-- Create policy for venues to view their webhook events  
CREATE POLICY "Venues can view their webhook events" ON public.webhook_events
FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- Reconcile specific bookings that should be confirmed based on webhook logs
-- Update booking 176 and payment record if they exist
UPDATE public.bookings 
SET status = 'confirmed', updated_at = now()
WHERE id = 176 AND status = 'pending_payment';

UPDATE public.booking_payments 
SET status = 'succeeded', processed_at = now(), updated_at = now()
WHERE booking_id = 176 AND status = 'pending';
