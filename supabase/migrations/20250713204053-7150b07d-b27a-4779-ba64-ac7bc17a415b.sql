-- Phase 1: Enhanced Role Management Security

-- 1. Update the update_user_role function with stronger security checks
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role app_role,
  target_venue_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_is_admin BOOLEAN;
  caller_current_role app_role;
  target_current_role app_role;
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
  SELECT is_admin(caller_user_id, target_venue_id) INTO caller_is_admin;
  
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
  
  -- Also log in booking_audit for backwards compatibility
  INSERT INTO public.booking_audit (
    booking_id, venue_id, changed_by, change_type, 
    field_name, old_value, new_value, notes
  ) VALUES (
    0, target_venue_id, caller_user_id::text, 'role_change',
    'user_role', target_current_role::text, new_role::text, 
    'Role updated for user: ' || target_user_id::text
  );
  
  RETURN TRUE;
END;
$$;

-- 2. Create additional security trigger to prevent direct profile role updates
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_updates()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile role protection
DROP TRIGGER IF EXISTS prevent_unauthorized_role_updates_trigger ON public.profiles;
CREATE TRIGGER prevent_unauthorized_role_updates_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_updates();

-- 3. Enhanced RLS policy for user_roles table
DROP POLICY IF EXISTS "Prevent unauthorized role creation" ON public.user_roles;
CREATE POLICY "Prevent unauthorized role creation" 
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow role creation by admins or during setup
    is_admin(auth.uid(), venue_id) OR 
    auth.uid() = user_id  -- Allow during initial setup
  );

-- 4. Create function to detect suspicious role-related activities
CREATE OR REPLACE FUNCTION public.detect_role_anomalies()
RETURNS TABLE(
  user_id UUID,
  venue_id UUID,
  suspicious_activity TEXT,
  event_count INTEGER,
  last_event TIMESTAMP WITH TIME ZONE
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;