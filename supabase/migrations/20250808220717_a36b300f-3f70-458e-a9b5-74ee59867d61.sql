
-- Add WiFi-related fields to the existing guests table
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS wifi_signup_source boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS device_fingerprint text,
ADD COLUMN IF NOT EXISTS wifi_last_connected timestamp with time zone;

-- Create wifi_analytics table for tracking WiFi connections
CREATE TABLE IF NOT EXISTS public.wifi_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  device_type text,
  device_os text,
  device_browser text,
  user_agent text,
  ip_address inet,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  session_duration_minutes integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create wifi_devices table for device tracking and return visitor recognition
CREATE TABLE IF NOT EXISTS public.wifi_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  device_type text,
  device_os text,
  device_browser text,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  connection_count integer NOT NULL DEFAULT 1,
  is_returning boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(venue_id, device_fingerprint)
);

-- Create wifi_sessions table for active session tracking
CREATE TABLE IF NOT EXISTS public.wifi_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  ended_at timestamp with time zone,
  duration_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.wifi_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wifi_analytics
CREATE POLICY "Public can insert wifi analytics" ON public.wifi_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Venue users can view their wifi analytics" ON public.wifi_analytics
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- RLS policies for wifi_devices  
CREATE POLICY "Public can insert wifi devices" ON public.wifi_devices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update wifi devices" ON public.wifi_devices
  FOR UPDATE USING (true);

CREATE POLICY "Venue users can view their wifi devices" ON public.wifi_devices
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- RLS policies for wifi_sessions
CREATE POLICY "Public can manage wifi sessions" ON public.wifi_sessions
  FOR ALL USING (true);

CREATE POLICY "Venue users can view their wifi sessions" ON public.wifi_sessions
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wifi_analytics_venue_id ON public.wifi_analytics(venue_id);
CREATE INDEX IF NOT EXISTS idx_wifi_analytics_device_fingerprint ON public.wifi_analytics(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_wifi_analytics_connected_at ON public.wifi_analytics(connected_at);

CREATE INDEX IF NOT EXISTS idx_wifi_devices_venue_id ON public.wifi_devices(venue_id);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_fingerprint ON public.wifi_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_last_seen ON public.wifi_devices(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_wifi_sessions_venue_id ON public.wifi_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_token ON public.wifi_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_active ON public.wifi_sessions(is_active);

-- Add "WiFi Portal" tag to venues that don't have it
INSERT INTO public.tags (venue_id, name, color, is_automatic)
SELECT DISTINCT v.id, 'WiFi Portal', '#10B981', false
FROM public.venues v
WHERE NOT EXISTS (
  SELECT 1 FROM public.tags t 
  WHERE t.venue_id = v.id AND t.name = 'WiFi Portal'
);
