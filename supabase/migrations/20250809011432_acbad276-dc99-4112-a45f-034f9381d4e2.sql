
-- Create wifi_settings table
CREATE TABLE public.wifi_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  network_name TEXT,
  welcome_message TEXT DEFAULT 'Welcome! Connect to our free WiFi',
  venue_description TEXT,
  terms_content TEXT DEFAULT 'By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. We collect basic device information for network security and analytics.',
  session_duration_hours INTEGER DEFAULT 24,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3B82F6',
  custom_css TEXT,
  font_family TEXT DEFAULT 'Arial, sans-serif',
  enable_device_fingerprinting BOOLEAN DEFAULT true,
  marketing_opt_in_default BOOLEAN DEFAULT false,
  data_retention_days INTEGER DEFAULT 30,
  auto_delete_sessions BOOLEAN DEFAULT true,
  terms_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(venue_id)
);

-- Enable RLS
ALTER TABLE public.wifi_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Venue users can view their wifi settings" ON public.wifi_settings
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their wifi settings" ON public.wifi_settings
  FOR ALL USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Create other wifi-related tables for completeness
CREATE TABLE public.wifi_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_type TEXT,
  device_os TEXT,
  device_browser TEXT,
  user_agent TEXT,
  ip_address INET,
  guest_id UUID REFERENCES public.guests(id),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.wifi_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  guest_id UUID REFERENCES public.guests(id),
  device_type TEXT,
  device_os TEXT,
  device_browser TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  connection_count INTEGER DEFAULT 1,
  is_returning BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(venue_id, device_fingerprint)
);

CREATE TABLE public.wifi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  session_token TEXT NOT NULL DEFAULT generate_wifi_session_token(),
  guest_id UUID REFERENCES public.guests(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on wifi tables
ALTER TABLE public.wifi_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wifi_analytics
CREATE POLICY "Venue users can view their wifi analytics" ON public.wifi_analytics
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can insert wifi analytics" ON public.wifi_analytics
  FOR INSERT WITH CHECK (true);

-- RLS policies for wifi_devices  
CREATE POLICY "Venue users can view their wifi devices" ON public.wifi_devices
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can manage wifi devices" ON public.wifi_devices
  FOR ALL USING (true);

-- RLS policies for wifi_sessions
CREATE POLICY "Venue users can view their wifi sessions" ON public.wifi_sessions
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can manage wifi sessions" ON public.wifi_sessions
  FOR ALL USING (true);
