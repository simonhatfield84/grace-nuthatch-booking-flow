
-- Add status enum for platform users
CREATE TYPE public.user_status AS ENUM (
  'pending_email_verification',
  'pending_venue_setup', 
  'pending_venue_approval',
  'active'
);

-- Add status enum for venues  
CREATE TYPE public.venue_status AS ENUM (
  'draft',
  'pending_approval',
  'active'
);

-- Add status column to profiles table (represents PlatformUser)
ALTER TABLE public.profiles 
ADD COLUMN status public.user_status DEFAULT 'pending_email_verification';

-- Update venues table to use proper status enum
ALTER TABLE public.venues 
DROP COLUMN IF EXISTS approval_status,
ADD COLUMN status public.venue_status DEFAULT 'draft';

-- Update existing data to use new status system
UPDATE public.profiles 
SET status = 'active' 
WHERE id IN (
  SELECT p.id 
  FROM public.profiles p 
  JOIN public.venues v ON p.venue_id = v.id
);

UPDATE public.venues 
SET status = 'active' 
WHERE id IN (
  SELECT venue_id 
  FROM public.profiles 
  WHERE venue_id IS NOT NULL
);

-- Create function to check setup completion based on user status
CREATE OR REPLACE FUNCTION public.setup_complete()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
  )
$$;

-- Update RLS policies for new status system
DROP POLICY IF EXISTS "Users can view their approved venue" ON public.venues;
CREATE POLICY "Users can view their venue when active" 
ON public.venues 
FOR SELECT 
USING ((id = get_user_venue(auth.uid())) AND (status = 'active'));

-- Allow venue creation during setup regardless of status
DROP POLICY IF EXISTS "Allow venue creation during setup" ON public.venues;
CREATE POLICY "Allow venue creation during setup" 
ON public.venues 
FOR INSERT 
WITH CHECK (status IN ('draft', 'pending_approval'));
