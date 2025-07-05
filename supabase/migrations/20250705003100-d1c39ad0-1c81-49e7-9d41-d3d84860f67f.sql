
-- Add approval status to venues table
ALTER TABLE public.venues ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.venues ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.venues ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- Update RLS policy for venues to only allow approved venues to be accessed by their users
DROP POLICY IF EXISTS "Users can view their venue" ON public.venues;
CREATE POLICY "Users can view their approved venue" 
  ON public.venues 
  FOR SELECT 
  USING (id = get_user_venue(auth.uid()) AND approval_status = 'approved');

-- Allow venue creation during setup (before approval)
CREATE POLICY "Allow venue creation during setup" 
  ON public.venues 
  FOR INSERT 
  WITH CHECK (approval_status = 'pending');

-- Create approval tokens table for secure approval links
CREATE TABLE public.approval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on approval_tokens
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;

-- Only system can manage approval tokens
CREATE POLICY "System manages approval tokens" 
  ON public.approval_tokens 
  FOR ALL 
  USING (false);
