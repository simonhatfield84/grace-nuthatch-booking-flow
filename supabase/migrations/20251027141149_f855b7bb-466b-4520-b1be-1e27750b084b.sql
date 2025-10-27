-- Create booking_attempts table for analytics
CREATE TABLE IF NOT EXISTS public.booking_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  venue_slug TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  date DATE,
  time TIME,
  party_size INTEGER,
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'abandoned')),
  reason TEXT,
  utm JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_party_size CHECK (party_size > 0 AND party_size <= 50)
);

-- Indexes for analytics queries
CREATE INDEX idx_booking_attempts_venue ON public.booking_attempts(venue_id, created_at DESC);
CREATE INDEX idx_booking_attempts_result ON public.booking_attempts(result, created_at DESC);
CREATE INDEX idx_booking_attempts_utm ON public.booking_attempts USING GIN(utm);

-- Add UTM columns to bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_utm_source ON public.bookings(utm_source) WHERE utm_source IS NOT NULL;

-- RLS Policies for booking_attempts
ALTER TABLE public.booking_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anon to INSERT booking_attempts (no PII, analytics only)
CREATE POLICY "anon_insert_booking_attempts"
  ON public.booking_attempts FOR INSERT
  TO anon
  WITH CHECK (true);

-- Venue admins can view their attempts
CREATE POLICY "venue_admins_view_attempts"
  ON public.booking_attempts FOR SELECT
  USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));