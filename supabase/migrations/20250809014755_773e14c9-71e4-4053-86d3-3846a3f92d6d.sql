
-- Create wifi_signups table to store guest WiFi registrations
CREATE TABLE public.wifi_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id),
  guest_id UUID REFERENCES public.guests(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  date_of_birth DATE,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  client_mac TEXT,
  ap_mac TEXT,
  ssid_name TEXT,
  radio_id TEXT,
  site TEXT,
  origin_url TEXT,
  ip_address INET,
  user_agent TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wifi_signups ENABLE ROW LEVEL SECURITY;

-- Venue users can view their signups
CREATE POLICY "Venue users can view their wifi signups" 
  ON public.wifi_signups 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

-- Public can create signups (for the portal)
CREATE POLICY "Public can create wifi signups" 
  ON public.wifi_signups 
  FOR INSERT 
  WITH CHECK (true);

-- Add new columns to wifi_settings for portal customization
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS background_image_url TEXT;
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2B3840';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#384140';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Playfair Display';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS custom_css TEXT;

-- Create function to handle WiFi portal submission
CREATE OR REPLACE FUNCTION public.handle_wifi_portal_submission(
  p_venue_slug TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_mobile_number TEXT,
  p_date_of_birth DATE DEFAULT NULL,
  p_marketing_consent BOOLEAN DEFAULT false,
  p_client_mac TEXT DEFAULT NULL,
  p_ap_mac TEXT DEFAULT NULL,
  p_ssid_name TEXT DEFAULT NULL,
  p_radio_id TEXT DEFAULT NULL,
  p_site TEXT DEFAULT NULL,
  p_origin_url TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  venue_record RECORD;
  guest_record RECORD;
  guest_id_var UUID;
  signup_id UUID;
  result JSON;
BEGIN
  -- Get venue by slug
  SELECT * INTO venue_record FROM public.venues WHERE slug = p_venue_slug AND approval_status = 'approved';
  
  IF venue_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Venue not found');
  END IF;
  
  -- Check if guest exists by email or phone
  SELECT * INTO guest_record FROM public.guests 
  WHERE venue_id = venue_record.id 
    AND (LOWER(TRIM(email)) = LOWER(TRIM(p_email)) OR TRIM(phone) = TRIM(p_mobile_number))
  LIMIT 1;
  
  -- Create or update guest
  IF guest_record IS NOT NULL THEN
    guest_id_var := guest_record.id;
    -- Update existing guest with latest info
    UPDATE public.guests SET
      name = p_full_name,
      email = COALESCE(p_email, email),
      phone = COALESCE(p_mobile_number, phone),
      opt_in_marketing = CASE WHEN p_marketing_consent THEN true ELSE opt_in_marketing END,
      wifi_last_connected = now(),
      wifi_signup_source = true,
      updated_at = now()
    WHERE id = guest_id_var;
  ELSE
    -- Create new guest
    INSERT INTO public.guests (
      venue_id, name, email, phone, opt_in_marketing, 
      wifi_last_connected, wifi_signup_source
    ) VALUES (
      venue_record.id, p_full_name, p_email, p_mobile_number, p_marketing_consent,
      now(), true
    ) RETURNING id INTO guest_id_var;
  END IF;
  
  -- Create WiFi signup record
  INSERT INTO public.wifi_signups (
    venue_id, guest_id, full_name, email, mobile_number, date_of_birth,
    marketing_consent, client_mac, ap_mac, ssid_name, radio_id, site,
    origin_url, ip_address, user_agent
  ) VALUES (
    venue_record.id, guest_id_var, p_full_name, p_email, p_mobile_number, p_date_of_birth,
    p_marketing_consent, p_client_mac, p_ap_mac, p_ssid_name, p_radio_id, p_site,
    p_origin_url, p_ip_address, p_user_agent
  ) RETURNING id INTO signup_id;
  
  -- Return success with origin URL for redirect
  result := json_build_object(
    'success', true,
    'signup_id', signup_id,
    'guest_id', guest_id_var,
    'origin_url', p_origin_url
  );
  
  RETURN result;
END;
$$;
