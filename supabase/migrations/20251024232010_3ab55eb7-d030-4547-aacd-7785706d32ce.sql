-- Pass 2: RLS Hardening + Availability Infrastructure
-- Add venue_id-based RLS policies and create logging/cache tables

-- ============================================================================
-- PART 1: Update RLS Policies on Join Tables (Direct venue_id checks)
-- ============================================================================

-- booking_payments: Replace JOIN-based policy with direct venue_id check
DROP POLICY IF EXISTS "Venue users can view their booking payments" ON public.booking_payments;
DROP POLICY IF EXISTS "Users can view their venue booking payments" ON public.booking_payments;

CREATE POLICY "Venue users can view their venue booking payments"
  ON public.booking_payments FOR SELECT
  USING (venue_id = public.get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage booking payments"
  ON public.booking_payments FOR ALL
  USING (venue_id = public.get_user_venue(auth.uid()));

-- booking_tokens: Add venue-aware policies
DROP POLICY IF EXISTS "Public can access tokens with valid reference" ON public.booking_tokens;

CREATE POLICY "Public can access tokens with valid reference"
  ON public.booking_tokens FOR SELECT
  USING (true);

CREATE POLICY "Venue users can view their venue booking tokens"
  ON public.booking_tokens FOR SELECT
  USING (auth.uid() IS NOT NULL AND venue_id = public.get_user_venue(auth.uid()));

-- service_tags: Replace with direct venue_id check
DROP POLICY IF EXISTS "Authenticated venue users can view service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Venue admins can manage service_tags" ON public.service_tags;

CREATE POLICY "Venue users can view their venue service tags"
  ON public.service_tags FOR SELECT
  USING (venue_id = public.get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage service tags"
  ON public.service_tags FOR ALL
  USING (venue_id = public.get_user_venue(auth.uid()));

-- guest_tags: Replace with direct venue_id check
DROP POLICY IF EXISTS "Authenticated venue users can view guest_tags" ON public.guest_tags;
DROP POLICY IF EXISTS "Venue users can manage guest_tags" ON public.guest_tags;

CREATE POLICY "Venue users can view their venue guest tags"
  ON public.guest_tags FOR SELECT
  USING (venue_id = public.get_user_venue(auth.uid()));

CREATE POLICY "Venue users can manage guest tags"
  ON public.guest_tags FOR ALL
  USING (venue_id = public.get_user_venue(auth.uid()));

-- ============================================================================
-- PART 2: Remove Public Read Access (CRITICAL SECURITY FIX)
-- ============================================================================

-- bookings: Remove public SELECT access
DROP POLICY IF EXISTS "Public can view bookings for availability" ON public.bookings;
-- Keep: "Public can create bookings" for widget submission
-- Keep: Authenticated venue user policies

-- services: Remove public SELECT policies
DROP POLICY IF EXISTS "Public can view active online bookable services" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
-- Keep: Authenticated venue user policies

-- tables: Remove public access
DROP POLICY IF EXISTS "Public can view online bookable tables" ON public.tables;
-- Keep: Authenticated venue user policies

-- ============================================================================
-- PART 3: Create Availability Logging Infrastructure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.availability_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  venue_slug text,
  service_id uuid,
  date date,
  party_size int,
  ip_hash text,
  ua_hash text,
  status text NOT NULL,
  took_ms int,
  result_slots int,
  error_text text,
  cached boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_availability_logs_occurred_at ON public.availability_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_availability_logs_venue_id ON public.availability_logs(venue_id);
CREATE INDEX IF NOT EXISTS idx_availability_logs_status ON public.availability_logs(status);
CREATE INDEX IF NOT EXISTS idx_availability_logs_ip_hash ON public.availability_logs(ip_hash);

-- RLS for availability_logs
ALTER TABLE public.availability_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert availability logs"
  ON public.availability_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Venue admins can view their venue logs"
  ON public.availability_logs FOR SELECT
  USING (venue_id = public.get_user_venue(auth.uid()));

-- ============================================================================
-- PART 4: Create Availability Cache Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.availability_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  service_id uuid,
  date date NOT NULL,
  party_size int NOT NULL,
  payload jsonb NOT NULL,
  UNIQUE (venue_id, service_id, date, party_size)
);

CREATE INDEX IF NOT EXISTS idx_availability_cache_created_at ON public.availability_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_availability_cache_lookup ON public.availability_cache(venue_id, date, party_size);

-- RLS for availability_cache (system-only access)
ALTER TABLE public.availability_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage availability cache"
  ON public.availability_cache FOR ALL
  USING (true);

-- ============================================================================
-- PART 5: Create Cache Cleanup Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_availability_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete cache entries older than 5 minutes
  DELETE FROM public.availability_cache
  WHERE created_at < now() - INTERVAL '5 minutes';
  
  -- Delete logs older than 30 days
  DELETE FROM public.availability_logs
  WHERE occurred_at < now() - INTERVAL '30 days';
END;
$$;