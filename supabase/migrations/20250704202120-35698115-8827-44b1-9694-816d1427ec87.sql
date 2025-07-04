
-- Add email configuration settings to venue_settings table
-- This will store email domain configuration for each venue

INSERT INTO public.venue_settings (setting_key, setting_value) 
VALUES 
  ('email_domain', '"grace-os.com"'::jsonb),
  ('email_from_name', '"Grace OS"'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create email templates table for storing different email types
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_type TEXT NOT NULL DEFAULT 'venue', -- 'platform' or 'venue'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email templates
CREATE POLICY "Allow all users to view email_templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all users to manage email_templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (true);

-- Insert default email templates
INSERT INTO public.email_templates (template_key, subject, html_content, template_type) VALUES
('booking_confirmation', 'Booking Confirmation - {{venue_name}}', 
 '<h1>Booking Confirmed</h1><p>Dear {{guest_name}},</p><p>Your booking for {{party_size}} guests on {{booking_date}} at {{booking_time}} has been confirmed.</p><p>Booking Reference: {{booking_reference}}</p><p>Best regards,<br>{{venue_name}}</p>', 
 'venue'),
('booking_reminder', 'Booking Reminder - {{venue_name}}', 
 '<h1>Booking Reminder</h1><p>Dear {{guest_name}},</p><p>This is a reminder of your booking tomorrow for {{party_size}} guests at {{booking_time}}.</p><p>Booking Reference: {{booking_reference}}</p><p>We look forward to seeing you!</p><p>Best regards,<br>{{venue_name}}</p>', 
 'venue'),
('user_invitation', 'Invitation to Grace OS', 
 '<h1>You''ve been invited to Grace OS</h1><p>You''ve been invited to join {{venue_name}} on Grace OS.</p><p>Click the link below to accept your invitation:</p><p><a href="{{invitation_link}}">Accept Invitation</a></p><p>Best regards,<br>The Grace OS Team</p>', 
 'platform');
