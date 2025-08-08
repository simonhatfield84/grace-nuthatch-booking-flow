
-- Create wifi_settings table for venue-specific WiFi configurations
CREATE TABLE public.wifi_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  
  -- Portal configuration
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT DEFAULT 'Welcome! Connect to our free WiFi',
  venue_description TEXT,
  logo_url TEXT,
  network_name TEXT,
  session_duration_hours INTEGER NOT NULL DEFAULT 24,
  
  -- Terms and conditions
  terms_content TEXT,
  terms_version INTEGER NOT NULL DEFAULT 1,
  
  -- Branding settings
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#059669',
  custom_css TEXT,
  font_family TEXT DEFAULT 'Inter',
  
  -- Advanced settings
  enable_device_fingerprinting BOOLEAN NOT NULL DEFAULT true,
  marketing_opt_in_default BOOLEAN NOT NULL DEFAULT false,
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  auto_delete_sessions BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one settings record per venue
  UNIQUE(venue_id)
);

-- Enable RLS
ALTER TABLE public.wifi_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for wifi_settings
CREATE POLICY "Users can view wifi settings for their venue"
  ON public.wifi_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.venue_id = wifi_settings.venue_id
        AND ur.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Users can update wifi settings for their venue"
  ON public.wifi_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.venue_id = wifi_settings.venue_id
        AND ur.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Users can insert wifi settings for their venue"
  ON public.wifi_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.venue_id = wifi_settings.venue_id
        AND ur.role IN ('owner', 'manager')
    )
  );

-- Create function to initialize default wifi settings for new venues
CREATE OR REPLACE FUNCTION public.create_default_wifi_settings(p_venue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.wifi_settings (
    venue_id,
    welcome_message,
    terms_content
  ) VALUES (
    p_venue_id,
    'Welcome! Connect to our free WiFi',
    'By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. We collect basic device information for network security and analytics.'
  )
  ON CONFLICT (venue_id) DO NOTHING;
END;
$function$;
