-- Security Hardening Phase 2: RPCs, Indexes, and search_path Fixes

-- ===================================
-- PART 1: CREATE HELPER FUNCTIONS AND RPCS
-- ===================================

-- Create helper to get user roles array
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid, _venue_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role::text)
  FROM public.user_roles
  WHERE user_id = _user_id AND venue_id = _venue_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid, uuid) TO authenticated;
COMMENT ON FUNCTION public.get_user_roles(uuid, uuid) IS 
  'Returns array of roles for a user in a specific venue';

-- Create server-side context helper
CREATE OR REPLACE FUNCTION public.get_current_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v uuid;
BEGIN
  v := public.get_user_venue(auth.uid());
  RETURN jsonb_build_object(
    'user_id', auth.uid(),
    'venue_id', v,
    'roles', public.get_user_roles(auth.uid(), v)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_current_context() TO authenticated;
COMMENT ON FUNCTION public.get_current_context() IS 
  'Returns current user context including venue_id and roles. Server-side source of truth.';

-- Create venue-scoped guest search RPC
CREATE OR REPLACE FUNCTION public.guests_search(
  _venue uuid, 
  _q text, 
  _limit int DEFAULT 10
)
RETURNS SETOF public.guests
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.guests g
  WHERE g.venue_id = _venue
    AND (
      g.name ILIKE '%' || _q || '%'
      OR g.email ILIKE '%' || _q || '%'
      OR g.phone ILIKE '%' || _q || '%'
    )
  ORDER BY g.updated_at DESC NULLS LAST
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.guests_search(uuid, text, int) TO authenticated;
COMMENT ON FUNCTION public.guests_search(uuid, text, int) IS 
  'Searches guests within a venue by name, email, or phone (case-insensitive). Requires venue_id for security.';

-- ===================================
-- PART 2: PERFORMANCE INDEXES
-- ===================================

-- Venue lookup (most common filter)
CREATE INDEX IF NOT EXISTS idx_guests_venue 
  ON public.guests(venue_id);

-- Case-insensitive name search
CREATE INDEX IF NOT EXISTS idx_guests_name_ci 
  ON public.guests (LOWER(name));

-- Case-insensitive email search (recreate with case-insensitive)
DROP INDEX IF EXISTS idx_guests_email;
CREATE INDEX idx_guests_email_ci 
  ON public.guests (LOWER(email));

-- Composite index for venue + updated_at (for ORDER BY optimization)
CREATE INDEX IF NOT EXISTS idx_guests_venue_updated 
  ON public.guests(venue_id, updated_at DESC NULLS LAST);

-- Analyze table to update statistics
ANALYZE public.guests;

-- ===================================
-- PART 3: FIX REMAINING search_path ISSUES
-- ===================================

-- 1. check_rate_limit_enhanced
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
  identifier text,
  operation_type text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit
  WHERE event_details->>'identifier' = identifier
    AND event_details->>'operation_type' = operation_type
    AND created_at >= window_start;
  
  INSERT INTO public.security_audit (
    event_type, event_details
  ) VALUES (
    'rate_limit_check',
    jsonb_build_object(
      'identifier', identifier,
      'operation_type', operation_type,
      'attempt_count', attempt_count,
      'max_attempts', max_attempts,
      'window_minutes', window_minutes,
      'blocked', attempt_count >= max_attempts
    )
  );
  
  RETURN attempt_count < max_attempts;
END;
$function$;

-- 2. cleanup_availability_cache
CREATE OR REPLACE FUNCTION public.cleanup_availability_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.availability_cache
  WHERE created_at < now() - INTERVAL '5 minutes';
  
  DELETE FROM public.availability_logs
  WHERE occurred_at < now() - INTERVAL '30 days';
END;
$function$;

-- 3. expire_pending_payments
CREATE OR REPLACE FUNCTION public.expire_pending_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.booking_payments
  SET 
    status = 'failed',
    failure_reason = 'Payment expired',
    updated_at = now()
  WHERE 
    status = 'pending' 
    AND created_at < now() - INTERVAL '1 hour';
    
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE 
    id IN (
      SELECT booking_id 
      FROM public.booking_payments 
      WHERE status = 'failed' 
      AND failure_reason = 'Payment expired'
    )
    AND status = 'pending_payment';
END;
$function$;

-- 4. log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_event_details jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT auth.uid(),
  p_venue_id uuid DEFAULT NULL::uuid,
  p_severity text DEFAULT 'LOW'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.security_audit (
    user_id,
    venue_id,
    event_type,
    event_details,
    created_at
  ) VALUES (
    p_user_id,
    p_venue_id,
    p_event_type,
    p_event_details || jsonb_build_object('severity', p_severity, 'timestamp', now()),
    now()
  );
END;
$function$;

-- ===================================
-- PART 4: AUDIT FUNCTION OWNERSHIP
-- ===================================

DO $$
DECLARE
  func record;
BEGIN
  FOR func IN 
    SELECT n.nspname, p.proname, pg_get_userbyid(p.proowner) as owner
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'check_rate_limit_enhanced',
        'cleanup_availability_cache',
        'expire_pending_payments',
        'log_security_event',
        'get_current_context',
        'get_user_roles',
        'guests_search'
      )
  LOOP
    RAISE NOTICE 'SECURITY DEFINER function %.% owned by %', func.nspname, func.proname, func.owner;
  END LOOP;
END $$;