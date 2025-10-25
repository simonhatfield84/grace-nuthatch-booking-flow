-- Create webhook retry queue table for durable webhook processing
CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT webhook_retry_queue_stripe_event_id_key UNIQUE(stripe_event_id)
);

-- Create indexes for efficient queries (without partial index predicate)
CREATE INDEX IF NOT EXISTS webhook_retry_queue_next_attempt_idx 
  ON public.webhook_retry_queue(next_attempt_at);

CREATE INDEX IF NOT EXISTS webhook_retry_queue_venue_idx 
  ON public.webhook_retry_queue(venue_id);

CREATE INDEX IF NOT EXISTS webhook_retry_queue_created_idx 
  ON public.webhook_retry_queue(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.webhook_retry_queue IS 
  'Durable retry queue for failed Stripe webhook events with exponential backoff';

-- Enable RLS
ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;

-- Super admins can view all retry queue entries
CREATE POLICY "Super admins can view retry queue"
  ON public.webhook_retry_queue FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Super admins can manage retry queue (for manual retry/dismiss)
CREATE POLICY "Super admins can manage retry queue"
  ON public.webhook_retry_queue FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Venue users can view their own retry queue
CREATE POLICY "Venue users can view their retry queue"
  ON public.webhook_retry_queue FOR SELECT
  USING (venue_id = public.get_user_venue(auth.uid()));