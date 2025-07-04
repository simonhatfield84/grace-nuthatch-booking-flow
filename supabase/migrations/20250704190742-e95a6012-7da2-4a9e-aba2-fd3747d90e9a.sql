
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'host', 'staff');

-- Create venues table for multi-tenant support
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role app_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES auth.users(id),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, venue_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _venue_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
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

-- Create function to get user's venue
CREATE OR REPLACE FUNCTION public.get_user_venue(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT venue_id
  FROM public.profiles
  WHERE id = _user_id
    AND is_active = true
$$;

-- Create function to check if user is admin (owner or manager)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID, _venue_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
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

-- RLS Policies for venues
CREATE POLICY "Users can view their venue"
  ON public.venues FOR SELECT
  TO authenticated
  USING (id = public.get_user_venue(auth.uid()));

CREATE POLICY "Admins can update their venue"
  ON public.venues FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid(), id));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their venue"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (venue_id = public.get_user_venue(auth.uid()));

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their venue"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid(), venue_id));

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their venue"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (venue_id = public.get_user_venue(auth.uid()));

CREATE POLICY "Admins can manage roles in their venue"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid(), venue_id));

-- Create trigger function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create profile if user was invited (has venue context)
  -- The setup wizard will handle the initial admin user separately
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if setup is complete (has admin users)
CREATE OR REPLACE FUNCTION public.setup_complete()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'owner'
  )
$$;
