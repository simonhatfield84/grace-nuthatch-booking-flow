
-- Phase 1: Fix Critical Privilege Escalation Vulnerability

-- 1. Remove dangerous policy that allows users to update their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. Create more restrictive policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 3. Prevent users from updating their own role or critical fields
CREATE POLICY "Users can update non-critical profile fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent updating role, venue_id, and is_active
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    venue_id = (SELECT venue_id FROM public.profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- 4. Create secure function for admin role management
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
BEGIN
  -- Check if caller is admin of the target venue
  SELECT is_admin(auth.uid(), target_venue_id) INTO caller_is_admin;
  
  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Insufficient permissions to modify user roles';
  END IF;
  
  -- Update the user role
  UPDATE public.user_roles 
  SET role = new_role, assigned_by = auth.uid(), assigned_at = NOW()
  WHERE user_id = target_user_id AND venue_id = target_venue_id;
  
  -- Update profile role as well
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id AND venue_id = target_venue_id;
  
  -- Log the role change for audit
  INSERT INTO public.booking_audit (
    booking_id, venue_id, changed_by, change_type, 
    field_name, old_value, new_value, notes
  ) VALUES (
    0, target_venue_id, auth.uid()::text, 'role_change',
    'user_role', NULL, new_role::text, 
    'Role updated for user: ' || target_user_id::text
  );
  
  RETURN TRUE;
END;
$$;

-- 5. Add unique webhook secrets per venue to venue_stripe_settings
ALTER TABLE public.venue_stripe_settings 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT UNIQUE;

-- 6. Create function to generate secure webhook secrets
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'whsec_' || encode(gen_random_bytes(32), 'base64');
END;
$$;

-- 7. Update existing venues to have webhook secrets
UPDATE public.venue_stripe_settings 
SET webhook_secret = generate_webhook_secret()
WHERE webhook_secret IS NULL;

-- 8. Create security audit table for better logging
CREATE TABLE IF NOT EXISTS public.security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  venue_id UUID REFERENCES public.venues(id),
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security audit
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs"
  ON public.security_audit FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid(), venue_id));

-- System can insert security audit logs
CREATE POLICY "System can insert security audit logs"
  ON public.security_audit FOR INSERT
  TO authenticated
  WITH CHECK (true);
