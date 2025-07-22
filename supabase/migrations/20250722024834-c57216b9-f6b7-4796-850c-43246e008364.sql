
-- Security Fixes for Supabase Warnings

-- 1. Fix search path for generate_booking_token function
CREATE OR REPLACE FUNCTION public.generate_booking_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use standard base64 encoding instead of base64url which is not supported
  -- Then replace characters to make it URL-safe
  RETURN replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
END;
$function$;

-- 2. Fix search path for prevent_unauthorized_role_updates function
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

-- 3. Fix search path for detect_role_anomalies function
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

-- 4. Create extensions schema and move pg_net extension
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension to extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions to use pg_net from the extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
