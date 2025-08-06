
-- Fix database function search paths and security issues
-- This addresses the critical security vulnerabilities found in the review

-- 1. Fix setup_venue_atomic function - add proper search path
CREATE OR REPLACE FUNCTION public.setup_venue_atomic(p_user_id uuid, p_email text, p_first_name text, p_last_name text, p_venue_name text, p_venue_slug text, p_venue_email text, p_venue_phone text, p_venue_address text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  venue_record RECORD;
  result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Create venue
    INSERT INTO public.venues (name, slug, email, phone, address, approval_status)
    VALUES (p_venue_name, p_venue_slug, p_venue_email, p_venue_phone, p_venue_address, 'pending')
    RETURNING * INTO venue_record;
    
    -- Create/Update profile
    INSERT INTO public.profiles (
      id, venue_id, email, first_name, last_name, role, is_active
    ) VALUES (
      p_user_id, venue_record.id, p_email, p_first_name, p_last_name, 'owner', true
    )
    ON CONFLICT (id) DO UPDATE SET
      venue_id = venue_record.id,
      first_name = p_first_name,
      last_name = p_last_name,
      role = 'owner',
      is_active = true;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, venue_id, role)
    VALUES (p_user_id, venue_record.id, 'owner')
    ON CONFLICT (user_id, venue_id, role) DO NOTHING;
    
    -- Return success with venue data
    result := json_build_object(
      'success', true,
      'venue', row_to_json(venue_record)
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Return error details
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    
    RETURN result;
  END;
END;
$function$;

-- 2. Fix prevent_unauthorized_role_updates trigger function - add proper search path
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow system functions and setup processes
  IF current_setting('role') = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent users from directly updating their role via profiles table
  IF OLD.role != NEW.role AND OLD.id = auth.uid() THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      auth.uid(), NEW.venue_id, 'direct_role_update_blocked',
      jsonb_build_object(
        'attempted_old_role', OLD.role,
        'attempted_new_role', NEW.role,
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Direct role updates are not allowed. Use proper role management functions.';
  END IF;
  
  -- Allow authorized role updates (via the secure function)
  RETURN NEW;
END;
$function$;

-- 3. Fix detect_role_anomalies function - add proper search path
CREATE OR REPLACE FUNCTION public.detect_role_anomalies()
 RETURNS TABLE(user_id uuid, venue_id uuid, suspicious_activity text, event_count integer, last_event timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sa.user_id,
    sa.venue_id,
    sa.event_type as suspicious_activity,
    COUNT(*)::INTEGER as event_count,
    MAX(sa.created_at) as last_event
  FROM public.security_audit sa
  WHERE sa.event_type IN (
    'unauthorized_role_change_attempt',
    'self_elevation_attempt', 
    'owner_demotion_attempt_blocked',
    'direct_role_update_blocked'
  )
  AND sa.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY sa.user_id, sa.venue_id, sa.event_type
  HAVING COUNT(*) >= 3  -- Flag users with 3+ suspicious attempts
  ORDER BY event_count DESC, last_event DESC;
END;
$function$;

-- 4. Add enhanced rate limiting function with proper search path
CREATE OR REPLACE FUNCTION public.check_advanced_rate_limit(
  identifier text, 
  operation_type text, 
  max_attempts integer DEFAULT 5, 
  window_minutes integer DEFAULT 15,
  threat_level text DEFAULT 'low'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp with time zone;
  adjusted_max_attempts integer;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Adjust limits based on threat level
  adjusted_max_attempts := CASE threat_level
    WHEN 'high' THEN GREATEST(1, max_attempts / 3)
    WHEN 'medium' THEN GREATEST(2, max_attempts / 2)
    ELSE max_attempts
  END;
  
  -- Count recent attempts for this identifier and operation
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit
  WHERE event_details->>'identifier' = identifier
    AND event_details->>'operation_type' = operation_type
    AND created_at >= window_start;
  
  -- Log the rate limit check with threat level
  INSERT INTO public.security_audit (
    event_type, event_details
  ) VALUES (
    'advanced_rate_limit_check',
    jsonb_build_object(
      'identifier', identifier,
      'operation_type', operation_type,
      'attempt_count', attempt_count,
      'max_attempts', adjusted_max_attempts,
      'window_minutes', window_minutes,
      'threat_level', threat_level,
      'blocked', attempt_count >= adjusted_max_attempts
    )
  );
  
  RETURN attempt_count < adjusted_max_attempts;
END;
$function$;

-- 5. Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.get_security_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  metrics jsonb;
BEGIN
  SELECT jsonb_build_object(
    'failed_logins_24h', (
      SELECT COUNT(*) FROM public.security_audit 
      WHERE event_type = 'signin_failed' 
      AND created_at >= NOW() - INTERVAL '24 hours'
    ),
    'blocked_attempts_24h', (
      SELECT COUNT(*) FROM public.security_audit 
      WHERE event_details->>'blocked' = 'true' 
      AND created_at >= NOW() - INTERVAL '24 hours'
    ),
    'high_threat_events_24h', (
      SELECT COUNT(*) FROM public.security_audit 
      WHERE event_details->>'severity' = 'HIGH' 
      AND created_at >= NOW() - INTERVAL '24 hours'
    ),
    'role_violations_24h', (
      SELECT COUNT(*) FROM public.security_audit 
      WHERE event_type LIKE '%role%' 
      AND created_at >= NOW() - INTERVAL '24 hours'
    ),
    'unique_threat_actors_24h', (
      SELECT COUNT(DISTINCT event_details->>'identifier') 
      FROM public.security_audit 
      WHERE event_details->>'threat_level' IN ('high', 'medium')
      AND created_at >= NOW() - INTERVAL '24 hours'
    )
  ) INTO metrics;
  
  RETURN metrics;
END;
$function$;

-- 6. Add trigger for the role update protection (if not exists)
DROP TRIGGER IF EXISTS prevent_unauthorized_role_updates_trigger ON public.profiles;
CREATE TRIGGER prevent_unauthorized_role_updates_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_updates();
