
-- Fix critical role escalation vulnerability in update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role app_role, target_venue_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_is_admin BOOLEAN;
  caller_current_role public.app_role;
  target_current_role public.app_role;
  caller_user_id UUID;
  owner_count INTEGER;
BEGIN
  -- Get caller's user ID
  caller_user_id := auth.uid();
  
  -- Prevent self-role elevation
  IF caller_user_id = target_user_id THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'role_change_attempt_blocked',
      jsonb_build_object(
        'reason', 'self_elevation_attempt',
        'target_role', new_role,
        'blocked_at', NOW(),
        'severity', 'HIGH'
      )
    );
    RAISE EXCEPTION 'Users cannot modify their own roles for security reasons';
  END IF;
  
  -- Check if caller is admin of the target venue
  SELECT public.is_admin(caller_user_id, target_venue_id) INTO caller_is_admin;
  
  IF NOT caller_is_admin THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'unauthorized_role_change_attempt',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_role', new_role,
        'blocked_at', NOW(),
        'severity', 'CRITICAL',
        'caller_role', 'unknown'
      )
    );
    RAISE EXCEPTION 'Insufficient permissions to modify user roles';
  END IF;
  
  -- Get current roles for logging and validation
  SELECT ur.role INTO caller_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = caller_user_id AND ur.venue_id = target_venue_id;
  
  SELECT ur.role INTO target_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = target_user_id AND ur.venue_id = target_venue_id;
  
  -- CRITICAL FIX: Only owners can create or modify owner roles
  IF new_role = 'owner' AND caller_current_role != 'owner' THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'owner_elevation_attempt_blocked',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_by_role', caller_current_role,
        'blocked_at', NOW(),
        'severity', 'CRITICAL',
        'reason', 'only_owners_can_create_owners'
      )
    );
    RAISE EXCEPTION 'Only venue owners can grant owner privileges';
  END IF;
  
  -- Prevent owners from being demoted by non-owners
  IF target_current_role = 'owner' AND caller_current_role != 'owner' THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'owner_demotion_attempt_blocked',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_by_role', caller_current_role,
        'blocked_at', NOW(),
        'severity', 'CRITICAL',
        'reason', 'insufficient_permissions'
      )
    );
    RAISE EXCEPTION 'Only owners can modify owner roles';
  END IF;
  
  -- Prevent removing the last owner (business continuity)
  IF target_current_role = 'owner' AND new_role != 'owner' THEN
    SELECT COUNT(*) INTO owner_count
    FROM public.user_roles ur
    WHERE ur.venue_id = target_venue_id AND ur.role = 'owner' AND ur.user_id != target_user_id;
    
    IF owner_count = 0 THEN
      INSERT INTO public.security_audit (
        user_id, venue_id, event_type, event_details
      ) VALUES (
        caller_user_id, target_venue_id, 'last_owner_removal_blocked',
        jsonb_build_object(
          'target_user_id', target_user_id,
          'blocked_at', NOW(),
          'severity', 'HIGH',
          'reason', 'cannot_remove_last_owner'
        )
      );
      RAISE EXCEPTION 'Cannot remove the last owner from a venue';
    END IF;
  END IF;
  
  -- Update the user role
  UPDATE public.user_roles 
  SET role = new_role, assigned_by = caller_user_id, assigned_at = NOW()
  WHERE user_id = target_user_id AND venue_id = target_venue_id;
  
  -- Update profile role as well
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id AND venue_id = target_venue_id;
  
  -- Log successful role change with enhanced details
  INSERT INTO public.security_audit (
    user_id, venue_id, event_type, event_details
  ) VALUES (
    caller_user_id, target_venue_id, 'role_change_successful',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'changed_by_role', caller_current_role,
      'changed_at', NOW(),
      'severity', 'MEDIUM',
      'action_type', 'role_modification'
    )
  );
  
  RETURN TRUE;
END;
$function$;

-- Create enhanced rate limiting function for critical operations
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
  identifier text,
  operation_type text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Count recent attempts for this identifier and operation
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit
  WHERE event_details->>'identifier' = identifier
    AND event_details->>'operation_type' = operation_type
    AND created_at >= window_start;
  
  -- Log the rate limit check
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

-- Create function to detect and log suspicious patterns
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_event_details jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT auth.uid(),
  p_venue_id uuid DEFAULT null,
  p_severity text DEFAULT 'LOW'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add indexes for better security audit performance
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON public.security_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_venue_id ON public.security_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON public.security_audit((event_details->>'severity'));
