-- Critical Security Fixes

-- 1. Enable RLS on tables table (CRITICAL - this table was missing RLS!)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tables
CREATE POLICY "Venue users can view their venue tables" 
ON public.tables 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (venue_id = get_user_venue(auth.uid())));

CREATE POLICY "Venue admins can manage their venue tables" 
ON public.tables 
FOR ALL 
USING ((auth.uid() IS NOT NULL) AND (venue_id = get_user_venue(auth.uid())) AND is_admin(auth.uid(), venue_id));

CREATE POLICY "Public can view online bookable tables" 
ON public.tables 
FOR SELECT 
USING ((online_bookable = true) AND (status = 'active'::text));

-- 2. Fix database function security by setting explicit search paths
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _venue_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.venue_id = _venue_id
      AND ur.role = _role
      AND p.is_active = true
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_venue(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT venue_id
  FROM public.profiles
  WHERE id = _user_id
    AND is_active = true
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid, _venue_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.venue_id = _venue_id
      AND ur.role IN ('owner', 'manager')
      AND p.is_active = true
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$function$;

-- 3. Add security trigger to prevent direct profile role updates
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

-- Create trigger for role update prevention
DROP TRIGGER IF EXISTS prevent_unauthorized_role_updates ON public.profiles;
CREATE TRIGGER prevent_unauthorized_role_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_updates();

-- 4. Create function to detect role anomalies
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