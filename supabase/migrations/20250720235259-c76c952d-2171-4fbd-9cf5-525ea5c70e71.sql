
-- Add email_logs table for tracking email delivery status and analytics
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'booking_confirmation', 'booking_reminder', 'user_invitation', etc.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  provider_response JSONB,
  error_message TEXT,
  booking_id INTEGER REFERENCES public.bookings(id) ON DELETE SET NULL,
  template_key TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add venue_id to email_templates table to support venue-specific templates
ALTER TABLE public.email_templates 
ADD COLUMN venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE;

-- Make template_key unique per venue (allow same template_key across different venues)
DROP INDEX IF EXISTS email_templates_template_key_key;
ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_venue_template_unique UNIQUE (venue_id, template_key);

-- Allow platform-wide templates to have NULL venue_id
ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_platform_template_unique 
EXCLUDE (template_key WITH =) WHERE (venue_id IS NULL);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_logs
CREATE POLICY "Venue users can view their venue email logs" 
  ON public.email_logs 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can create email logs" 
  ON public.email_logs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update email logs" 
  ON public.email_logs 
  FOR UPDATE 
  USING (true);

-- Update email_templates RLS policies to support venue-specific templates
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Super admins can manage email templates" ON public.email_templates;

CREATE POLICY "Users can view platform and their venue templates" 
  ON public.email_templates 
  FOR SELECT 
  USING (
    venue_id IS NULL OR 
    venue_id = get_user_venue(auth.uid())
  );

CREATE POLICY "Venue admins can manage their venue templates" 
  ON public.email_templates 
  FOR ALL 
  USING (
    venue_id = get_user_venue(auth.uid()) AND 
    is_admin(auth.uid(), venue_id)
  );

CREATE POLICY "Super admins can manage all templates" 
  ON public.email_templates 
  FOR ALL 
  USING (is_super_admin(auth.uid()));

-- Insert default venue-specific email templates (these will be created per venue)
-- We'll handle this in the application code to create templates per venue

-- Add indexes for performance
CREATE INDEX idx_email_logs_venue_id ON public.email_logs(venue_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at);
CREATE INDEX idx_email_templates_venue_id ON public.email_templates(venue_id);
