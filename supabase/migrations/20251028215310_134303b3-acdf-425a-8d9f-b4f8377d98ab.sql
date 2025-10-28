-- Security Patch Set A: Comprehensive Server-Side Hardening
-- All changes are idempotent and safe to re-run

-- ============================================================================
-- STEP 1: Lock Down booking_payments (priv.create_booking_payment already exists)
-- ============================================================================

-- 1.1 Drop overly permissive policies
DROP POLICY IF EXISTS "System can manage booking payments" ON public.booking_payments;
DROP POLICY IF EXISTS "Public can create booking payments" ON public.booking_payments;

-- 1.2 Add restrictive policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_payments'
      AND policyname = 'bp_block_client_insert'
  ) THEN
    CREATE POLICY bp_block_client_insert ON public.booking_payments
      FOR INSERT TO anon, authenticated WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_payments'
      AND policyname = 'bp_service_role_all'
  ) THEN
    CREATE POLICY bp_service_role_all ON public.booking_payments
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

-- ============================================================================
-- STEP 2: Lock Down tables Table
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active online-bookable tables" ON public.tables;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tables' AND policyname='tables_no_client_read'
  ) THEN
    CREATE POLICY tables_no_client_read ON public.tables
      FOR SELECT TO anon, authenticated USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tables' AND policyname='tables_no_client_write'
  ) THEN
    CREATE POLICY tables_no_client_write ON public.tables
      FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tables' AND policyname='tables_service_role_all'
  ) THEN
    CREATE POLICY tables_service_role_all ON public.tables
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

-- ============================================================================
-- STEP 3: Secure Backup Tables
-- ============================================================================

ALTER TABLE IF EXISTS public.services_backup_utc_now ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services_backup_utc_now_2 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.services_backup_utc_now') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='services_backup_utc_now' 
        AND policyname='backup_deny_all'
    ) THEN
      CREATE POLICY backup_deny_all ON public.services_backup_utc_now
        FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='services_backup_utc_now' 
        AND policyname='backup_service_role_all'
    ) THEN
      CREATE POLICY backup_service_role_all ON public.services_backup_utc_now
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
  END IF;

  IF to_regclass('public.services_backup_utc_now_2') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='services_backup_utc_now_2' 
        AND policyname='backup2_deny_all'
    ) THEN
      CREATE POLICY backup2_deny_all ON public.services_backup_utc_now_2
        FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='services_backup_utc_now_2' 
        AND policyname='backup2_service_role_all'
    ) THEN
      CREATE POLICY backup2_service_role_all ON public.services_backup_utc_now_2
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
  END IF;
END$$;

-- ============================================================================
-- STEP 4: Webhook Replay Idempotency
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.webhook_events'::regclass
      AND conname = 'uniq_event_per_venue'
  ) THEN
    ALTER TABLE public.webhook_events
    ADD CONSTRAINT uniq_event_per_venue UNIQUE (stripe_event_id, venue_id);
  END IF;
END$$;

-- ============================================================================
-- STEP 5: Bot Protection - Rate Limiting
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip inet NOT NULL,
  path text NOT NULL,
  window_start timestamptz NOT NULL,
  hits int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ip, path, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='rate_limits' AND policyname='rate_limits_service_role'
  ) THEN
    CREATE POLICY rate_limits_service_role ON public.rate_limits
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip inet,
  p_path text,
  p_max_hits int DEFAULT 10
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_hits int;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  
  INSERT INTO public.rate_limits (ip, path, window_start, hits)
  VALUES (p_ip, p_path, v_window_start, 1)
  ON CONFLICT (ip, path, window_start) 
  DO UPDATE SET hits = rate_limits.hits + 1
  RETURNING hits INTO v_hits;
  
  RETURN v_hits <= p_max_hits;
END$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(inet, text, int) TO service_role;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(inet, text, int) FROM PUBLIC, anon, authenticated;

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits() 
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- ============================================================================
-- STEP 9: Reduce booking_windows Leakage
-- ============================================================================

DROP POLICY IF EXISTS "Public can view booking windows" ON public.booking_windows;
DROP POLICY IF EXISTS "Public can view active booking windows" ON public.booking_windows;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='booking_windows' 
      AND policyname='booking_windows_no_direct_client_read'
  ) THEN
    CREATE POLICY booking_windows_no_direct_client_read ON public.booking_windows
      FOR SELECT TO anon, authenticated USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='booking_windows' 
      AND policyname='booking_windows_venue_users_read'
  ) THEN
    CREATE POLICY booking_windows_venue_users_read ON public.booking_windows
      FOR SELECT TO authenticated 
      USING (venue_id = get_user_venue(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='booking_windows' 
      AND policyname='booking_windows_service_role_all'
  ) THEN
    CREATE POLICY booking_windows_service_role_all ON public.booking_windows
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Ensure anon can read public view
REVOKE ALL ON public.booking_windows FROM anon;
GRANT SELECT ON public.booking_windows_public TO anon, authenticated;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY bp_block_client_insert ON public.booking_payments IS 
  'Security: Blocks direct payment inserts from clients. Use priv.create_booking_payment() instead.';

COMMENT ON POLICY tables_no_client_read ON public.tables IS 
  'Security: Prevents clients from reading table inventory directly. Use server-side allocation.';

COMMENT ON CONSTRAINT uniq_event_per_venue ON public.webhook_events IS 
  'Idempotency: Prevents duplicate webhook processing for same event + venue.';

COMMENT ON FUNCTION public.check_rate_limit(inet, text, int) IS 
  'Security: Rate limiting per IP and path. Returns false if limit exceeded.';