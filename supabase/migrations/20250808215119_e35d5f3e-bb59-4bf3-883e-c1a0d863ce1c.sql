
-- Create wifi_analytics table for tracking WiFi connections and device info
CREATE TABLE public.wifi_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop', 'unknown'
  device_os TEXT,
  device_browser TEXT,
  user_agent TEXT,
  ip_address INET,
  mac_address TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_duration_minutes INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  data_usage_mb NUMERIC DEFAULT 0,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  signup_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wifi_sessions table for active session tracking
CREATE TABLE public.wifi_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  data_usage_mb NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wifi_devices table for device fingerprinting and return visitor recognition
CREATE TABLE public.wifi_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  connection_count INTEGER DEFAULT 1,
  device_type TEXT,
  device_os TEXT,
  device_browser TEXT,
  is_returning BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(venue_id, device_fingerprint)
);

-- Add WiFi-related columns to guests table
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS wifi_signup_source BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS wifi_last_connected TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX idx_wifi_analytics_venue_id ON public.wifi_analytics(venue_id);
CREATE INDEX idx_wifi_analytics_device_fingerprint ON public.wifi_analytics(device_fingerprint);
CREATE INDEX idx_wifi_analytics_connected_at ON public.wifi_analytics(connected_at);
CREATE INDEX idx_wifi_sessions_venue_id ON public.wifi_sessions(venue_id);
CREATE INDEX idx_wifi_sessions_device_fingerprint ON public.wifi_sessions(device_fingerprint);
CREATE INDEX idx_wifi_sessions_session_token ON public.wifi_sessions(session_token);
CREATE INDEX idx_wifi_sessions_is_active ON public.wifi_sessions(is_active);
CREATE INDEX idx_wifi_devices_venue_id ON public.wifi_devices(venue_id);
CREATE INDEX idx_wifi_devices_fingerprint ON public.wifi_devices(device_fingerprint);
CREATE INDEX idx_guests_device_fingerprint ON public.guests(device_fingerprint);

-- Enable RLS on new tables
ALTER TABLE public.wifi_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for wifi_analytics
CREATE POLICY "Venue users can view their wifi analytics" 
  ON public.wifi_analytics 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Public can insert wifi analytics" 
  ON public.wifi_analytics 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update wifi analytics" 
  ON public.wifi_analytics 
  FOR UPDATE 
  USING (true);

-- RLS policies for wifi_sessions
CREATE POLICY "Venue users can view their wifi sessions" 
  ON public.wifi_sessions 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Public can manage wifi sessions" 
  ON public.wifi_sessions 
  FOR ALL 
  USING (true);

-- RLS policies for wifi_devices
CREATE POLICY "Venue users can view their wifi devices" 
  ON public.wifi_devices 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Public can manage wifi devices" 
  ON public.wifi_devices 
  FOR ALL 
  USING (true);

-- Create function to generate session tokens
CREATE OR REPLACE FUNCTION public.generate_wifi_session_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'wifi_' || encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Create function to track WiFi analytics
CREATE OR REPLACE FUNCTION public.track_wifi_connection(
  p_venue_id UUID,
  p_device_fingerprint TEXT,
  p_device_type TEXT DEFAULT NULL,
  p_device_os TEXT DEFAULT NULL,
  p_device_browser TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_guest_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  analytics_id UUID;
  device_record RECORD;
BEGIN
  -- Insert or update device record
  INSERT INTO public.wifi_devices (
    venue_id, device_fingerprint, guest_id, device_type, device_os, device_browser, last_seen_at, connection_count
  ) VALUES (
    p_venue_id, p_device_fingerprint, p_guest_id, p_device_type, p_device_os, p_device_browser, now(), 1
  )
  ON CONFLICT (venue_id, device_fingerprint) 
  DO UPDATE SET 
    last_seen_at = now(),
    connection_count = wifi_devices.connection_count + 1,
    is_returning = true,
    guest_id = COALESCE(p_guest_id, wifi_devices.guest_id),
    updated_at = now();

  -- Insert analytics record
  INSERT INTO public.wifi_analytics (
    venue_id, device_fingerprint, device_type, device_os, device_browser, 
    user_agent, ip_address, guest_id
  ) VALUES (
    p_venue_id, p_device_fingerprint, p_device_type, p_device_os, p_device_browser,
    p_user_agent, p_ip_address, p_guest_id
  ) RETURNING id INTO analytics_id;

  RETURN analytics_id;
END;
$$;
