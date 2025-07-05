
-- Add super_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Create platform_admins table to track super admin permissions
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb DEFAULT '{"all": true}'::jsonb,
  UNIQUE(user_id)
);

-- Enable RLS on platform_admins
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_admins
CREATE POLICY "Super admins can manage platform admins"
  ON public.platform_admins
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid() AND pa.is_active = true
    )
  );

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Create platform_metrics table for system-wide analytics
CREATE TABLE public.platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_venues integer DEFAULT 0,
  active_venues integer DEFAULT 0,
  pending_venues integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_revenue_cents integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(metric_date)
);

-- Enable RLS on platform_metrics
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for platform_metrics
CREATE POLICY "Super admins can view platform metrics"
  ON public.platform_metrics
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Update venues table RLS to allow super admin access
CREATE POLICY "Super admins can view all venues"
  ON public.venues
  FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all venues"
  ON public.venues
  FOR UPDATE
  USING (is_super_admin(auth.uid()));

-- Update profiles table RLS to allow super admin access
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (is_super_admin(auth.uid()));
