
-- Add venue_id column to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE;

-- Update RLS policies to be venue-specific
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Super admins can manage email templates" ON public.email_templates;

-- Create venue-specific RLS policies
CREATE POLICY "Users can view their venue templates" 
  ON public.email_templates 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()) OR venue_id IS NULL);

CREATE POLICY "Users can create their venue templates" 
  ON public.email_templates 
  FOR INSERT 
  WITH CHECK (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Users can update their venue templates" 
  ON public.email_templates 
  FOR UPDATE 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Users can delete their venue templates" 
  ON public.email_templates 
  FOR DELETE 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Super admins can manage all email templates" 
  ON public.email_templates 
  FOR ALL 
  USING (is_super_admin(auth.uid()));
