
-- Fix Critical RLS Policy Vulnerabilities
-- Step 1: Replace overly permissive policies with proper security controls

-- Fix booking_priorities table (currently allows all users)
DROP POLICY IF EXISTS "Allow all users to view booking_priorities" ON public.booking_priorities;
DROP POLICY IF EXISTS "Allow all users to create booking_priorities" ON public.booking_priorities;
DROP POLICY IF EXISTS "Allow all users to update booking_priorities" ON public.booking_priorities;
DROP POLICY IF EXISTS "Allow all users to delete booking_priorities" ON public.booking_priorities;

CREATE POLICY "Venue users can view their venue booking priorities" 
  ON public.booking_priorities FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can manage their venue booking priorities" 
  ON public.booking_priorities FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Fix join_groups table (currently allows all users)
DROP POLICY IF EXISTS "Allow all users to view join_groups" ON public.join_groups;
DROP POLICY IF EXISTS "Allow all users to create join_groups" ON public.join_groups;
DROP POLICY IF EXISTS "Allow all users to update join_groups" ON public.join_groups;
DROP POLICY IF EXISTS "Allow all users to delete join_groups" ON public.join_groups;

-- Add venue_id column to join_groups for proper isolation
ALTER TABLE public.join_groups ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing join_groups to have proper venue_id
UPDATE public.join_groups SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;

-- Make venue_id required
ALTER TABLE public.join_groups ALTER COLUMN venue_id SET NOT NULL;

CREATE POLICY "Venue users can view their venue join groups" 
  ON public.join_groups FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their venue join groups" 
  ON public.join_groups FOR ALL 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Fix blocks table (currently allows all users)
DROP POLICY IF EXISTS "Allow all users to view blocks" ON public.blocks;
DROP POLICY IF EXISTS "Allow all users to create blocks" ON public.blocks;
DROP POLICY IF EXISTS "Allow all users to update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Allow all users to delete blocks" ON public.blocks;

-- Add venue_id column to blocks for proper isolation
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing blocks to have proper venue_id
UPDATE public.blocks SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;

-- Make venue_id required
ALTER TABLE public.blocks ALTER COLUMN venue_id SET NOT NULL;

CREATE POLICY "Venue users can view their venue blocks" 
  ON public.blocks FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their venue blocks" 
  ON public.blocks FOR ALL 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Fix booking_audit table (currently allows all users to create)
DROP POLICY IF EXISTS "Allow all users to create booking_audit" ON public.booking_audit;
DROP POLICY IF EXISTS "Allow all users to view booking_audit" ON public.booking_audit;

-- Add venue_id column to booking_audit for proper isolation
ALTER TABLE public.booking_audit ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing booking_audit records
UPDATE public.booking_audit SET venue_id = (
  SELECT b.venue_id FROM public.bookings b WHERE b.id = booking_audit.booking_id
) WHERE venue_id IS NULL;

CREATE POLICY "Venue users can view their venue booking audit" 
  ON public.booking_audit FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can create booking audit entries" 
  ON public.booking_audit FOR INSERT 
  WITH CHECK (true);

-- Restrict email_verification_codes access (currently allows anyone)
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can update codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can verify codes" ON public.email_verification_codes;

-- Only allow system functions to manage verification codes
CREATE POLICY "System functions can manage verification codes" 
  ON public.email_verification_codes FOR ALL 
  USING (current_setting('role') = 'service_role' OR auth.uid() IS NULL);

-- Restrict email_templates to admin access only
DROP POLICY IF EXISTS "Allow all users to view email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow all users to manage email_templates" ON public.email_templates;

CREATE POLICY "Authenticated users can view email templates" 
  ON public.email_templates FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage email templates" 
  ON public.email_templates FOR ALL 
  USING (is_super_admin(auth.uid()));

-- Add venue_id to booking_priorities for proper isolation
ALTER TABLE public.booking_priorities ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing booking_priorities to have proper venue_id
UPDATE public.booking_priorities SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;

-- Make venue_id required
ALTER TABLE public.booking_priorities ALTER COLUMN venue_id SET NOT NULL;

-- Update booking_priorities policies to use venue_id
DROP POLICY IF EXISTS "Venue users can view their venue booking priorities" ON public.booking_priorities;
DROP POLICY IF EXISTS "Venue admins can manage their venue booking priorities" ON public.booking_priorities;

CREATE POLICY "Venue users can view their venue booking priorities" 
  ON public.booking_priorities FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their venue booking priorities" 
  ON public.booking_priorities FOR ALL 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));
