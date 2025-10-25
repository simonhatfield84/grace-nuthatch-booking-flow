-- Security Fixes for Warning-Level Issues
-- Addresses:
-- 1. Function search_path mutable (SUPA linter warning)
-- 2. Venues contact info publicly exposed

-- ============================================
-- 1. FIX SECURITY DEFINER FUNCTIONS - Add SET search_path
-- ============================================

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _venue_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.venue_id = _venue_id
      AND ur.role = _role
      AND p.is_active = true
  )
$$;

COMMENT ON FUNCTION public.has_role IS 
  'Checks if a user has a specific role for a venue. Uses SET search_path for security.';

-- Fix get_user_venue function
CREATE OR REPLACE FUNCTION public.get_user_venue(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT venue_id
  FROM public.profiles
  WHERE id = _user_id
    AND is_active = true
$$;

COMMENT ON FUNCTION public.get_user_venue IS 
  'Returns the venue ID for a given user. Uses SET search_path for security.';

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID, _venue_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.venue_id = _venue_id
      AND ur.role IN ('owner', 'manager')
      AND p.is_active = true
  )
$$;

COMMENT ON FUNCTION public.is_admin IS 
  'Checks if a user is an admin (owner or manager) for a venue. Uses SET search_path for security.';

-- Fix setup_complete function
CREATE OR REPLACE FUNCTION public.setup_complete()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'owner'
  )
$$;

COMMENT ON FUNCTION public.setup_complete IS 
  'Checks if initial setup is complete (has at least one owner). Uses SET search_path for security.';

-- Fix is_super_admin function (if exists)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

COMMENT ON FUNCTION public.is_super_admin IS 
  'Checks if a user is a platform super admin. Uses SET search_path for security.';

-- ============================================
-- 2. FIX VENUES CONTACT INFO EXPOSURE
-- ============================================

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view approved venues" ON public.venues;

-- Create a restricted view for public access (name, slug, id only)
CREATE OR REPLACE VIEW public.venues_public AS
SELECT 
  id,
  name,
  slug,
  created_at,
  approval_status
FROM public.venues
WHERE approval_status = 'approved';

COMMENT ON VIEW public.venues_public IS 
  'Public view of venues with only non-sensitive information (name, slug, id). Contact details restricted.';

-- Grant public access to the restricted view
GRANT SELECT ON public.venues_public TO anon;
GRANT SELECT ON public.venues_public TO authenticated;

-- Add new RLS policy: Authenticated users with venue access can see full venue details
CREATE POLICY "Users can view their own venue details"
  ON public.venues 
  FOR SELECT 
  TO authenticated
  USING (id = public.get_user_venue(auth.uid()));

-- Add policy: Platform admins can view all venues
CREATE POLICY "Platform admins can view all venues"
  ON public.venues 
  FOR SELECT 
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

COMMENT ON POLICY "Users can view their own venue details" ON public.venues IS 
  'Venue staff can see full details of their own venue including contact info';

COMMENT ON POLICY "Platform admins can view all venues" ON public.venues IS 
  'Platform administrators can view all venue details for management purposes';