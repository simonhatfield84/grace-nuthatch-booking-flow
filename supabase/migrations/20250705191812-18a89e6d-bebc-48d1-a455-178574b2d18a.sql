
-- Create dedicated platform_settings table (separate from venue_settings)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'boolean', 'number', 'object'
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Some settings might be public (like platform name)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_settings
CREATE POLICY "Super admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Public settings can be viewed by authenticated users" ON public.platform_settings
  FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_name', '"Grace Platform"', 'string', 'Name of the platform', true),
('support_email', '"support@graceplatform.com"', 'string', 'Support contact email', false),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', false),
('allow_new_venues', 'true', 'boolean', 'Allow new venue registration', false),
('smtp_host', '""', 'string', 'SMTP server host', false),
('smtp_port', '587', 'number', 'SMTP server port', false),
('smtp_username', '""', 'string', 'SMTP username', false),
('smtp_password', '""', 'string', 'SMTP password', false),
('from_email', '"noreply@graceplatform.com"', 'string', 'Default from email address', false),
('email_signature', '"Best regards,\nThe Grace Platform Team"', 'string', 'Default email signature', false),
('platform_logo_url', '""', 'string', 'Platform logo URL', true),
('primary_color', '"#ea580c"', 'string', 'Primary brand color', true),
('secondary_color', '"#1e293b"', 'string', 'Secondary brand color', true),
('footer_text', '"© 2024 Grace Platform. All rights reserved."', 'string', 'Footer text', true),
('privacy_policy_url', '""', 'string', 'Privacy policy URL', true),
('terms_of_service_url', '""', 'string', 'Terms of service URL', true),
('stripe_publishable_key', '""', 'string', 'Stripe publishable key', false),
('stripe_webhook_secret', '""', 'string', 'Stripe webhook secret', false),
('trial_period_days', '14', 'number', 'Free trial period in days', false),
('grace_period_days', '7', 'number', 'Grace period for overdue accounts', false),
('auto_suspend_overdue', 'true', 'boolean', 'Auto-suspend overdue accounts', false),
('send_payment_reminders', 'true', 'boolean', 'Send payment reminder emails', false);

-- Create index for performance
CREATE INDEX idx_platform_settings_key ON public.platform_settings(setting_key);
CREATE INDEX idx_platform_settings_public ON public.platform_settings(is_public);
