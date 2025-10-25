-- Migration: Enhance availability_logs schema for lock lifecycle tracking

BEGIN;

-- Add action column for detailed lifecycle tracking
ALTER TABLE public.availability_logs
  ADD COLUMN IF NOT EXISTS action text;

-- Add time column for specific time slot tracking
ALTER TABLE public.availability_logs
  ADD COLUMN IF NOT EXISTS "time" time without time zone;

-- Add venue_slug for easier querying
ALTER TABLE public.availability_logs
  ADD COLUMN IF NOT EXISTS venue_slug text;

-- Update existing rows to map status to action
UPDATE public.availability_logs
SET action = CASE
  WHEN status = 'held' THEN 'held'
  WHEN status = 'released' THEN 'released'
  WHEN status = 'cleanup' THEN 'expired'
  WHEN status = 'ok' THEN 'check'
  WHEN status = 'error' THEN 'check'
  WHEN status = 'rate_limited' THEN 'rate_limited'
  ELSE 'check'
END
WHERE action IS NULL;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS availability_logs_action_idx
  ON public.availability_logs(action, occurred_at DESC);

CREATE INDEX IF NOT EXISTS availability_logs_venue_date_idx
  ON public.availability_logs(venue_id, date, occurred_at DESC)
  WHERE action IN ('held', 'released', 'expired');

-- Add comments
COMMENT ON COLUMN public.availability_logs.action IS 
  'Lock lifecycle event type: check, cache_invalidate, held, released, expired, rate_limited';

COMMENT ON COLUMN public.availability_logs.time IS 
  'Specific time slot for held/released/expired actions';

COMMENT ON COLUMN public.availability_logs.venue_slug IS 
  'Venue slug for easier correlation with frontend requests';

COMMIT;
