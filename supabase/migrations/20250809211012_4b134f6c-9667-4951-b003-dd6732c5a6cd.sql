
-- Create webhook_events table for tracking and debugging webhook processing
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'processing',
  venue_id UUID,
  booking_id INTEGER,
  payment_intent_id TEXT,
  amount_cents INTEGER,
  error_details JSONB,
  raw_event_data JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow system to manage webhook events
CREATE POLICY "System can manage webhook events" ON public.webhook_events
  FOR ALL USING (true);

-- Allow venue users to view their webhook events for debugging
CREATE POLICY "Venue users can view their webhook events" ON public.webhook_events
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_webhook_events_stripe_event_id ON public.webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_booking_id ON public.webhook_events(booking_id);
CREATE INDEX idx_webhook_events_venue_id ON public.webhook_events(venue_id);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at DESC);
