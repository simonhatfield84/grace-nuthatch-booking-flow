-- Critical Security Fixes (Part 2 - Avoiding Conflicts)

-- 1. Enable RLS on tables table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'tables' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

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

-- 3. Update existing security function with proper search path
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
        'blocked_at', NOW()
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
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Insufficient permissions to modify user roles';
  END IF;
  
  -- Get current roles for logging
  SELECT ur.role INTO caller_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = caller_user_id AND ur.venue_id = target_venue_id;
  
  SELECT ur.role INTO target_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = target_user_id AND ur.venue_id = target_venue_id;
  
  -- Prevent owners from being demoted by managers
  IF target_current_role = 'owner' AND caller_current_role != 'owner' THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'owner_demotion_attempt_blocked',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_by_role', caller_current_role,
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Only owners can modify owner roles';
  END IF;
  
  -- Update the user role
  UPDATE public.user_roles 
  SET role = new_role, assigned_by = caller_user_id, assigned_at = NOW()
  WHERE user_id = target_user_id AND venue_id = target_venue_id;
  
  -- Update profile role as well
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id AND venue_id = target_venue_id;
  
  -- Log successful role change
  INSERT INTO public.security_audit (
    user_id, venue_id, event_type, event_details
  ) VALUES (
    caller_user_id, target_venue_id, 'role_change_successful',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'changed_by_role', caller_current_role,
      'changed_at', NOW()
    )
  );
  
  RETURN TRUE;
END;
$function$;