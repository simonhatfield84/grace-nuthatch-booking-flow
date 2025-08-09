
-- Add branding and customization columns to wifi_settings table
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS background_image_url text;
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Playfair Display';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2B3840';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#384140';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#FFFFFF';
ALTER TABLE public.wifi_settings ADD COLUMN IF NOT EXISTS custom_css text;

-- Create wifi_signups table for portal submissions
CREATE TABLE IF NOT EXISTS public.wifi_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) NOT NULL,
  guest_id uuid REFERENCES public.guests(id),
  full_name text NOT NULL,
  email text NOT NULL,
  mobile_number text NOT NULL,
  date_of_birth date,
  marketing_consent boolean NOT NULL DEFAULT false,
  client_mac text,
  ap_mac text,
  ssid_name text,
  radio_id text,
  site text,
  origin_url text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on wifi_signups table
ALTER TABLE public.wifi_signups ENABLE ROW LEVEL SECURITY;

-- Create policy for venue users to view their wifi signups
CREATE POLICY "Venue users can view their wifi signups" ON public.wifi_signups
  FOR SELECT USING (venue_id = get_user_venue(auth.uid()));

-- Create policy for public wifi portal submissions
CREATE POLICY "Public can create wifi signups" ON public.wifi_signups
  FOR INSERT WITH CHECK (true);

-- Create function to handle WiFi portal submissions
CREATE OR REPLACE FUNCTION public.handle_wifi_portal_submission(
  p_venue_slug text,
  p_full_name text,
  p_email text,
  p_mobile_number text,
  p_date_of_birth date DEFAULT NULL,
  p_marketing_consent boolean DEFAULT false,
  p_client_mac text DEFAULT NULL,
  p_ap_mac text DEFAULT NULL,
  p_ssid_name text DEFAULT NULL,
  p_radio_id text DEFAULT NULL,
  p_site text DEFAULT NULL,
  p_origin_url text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  venue_record RECORD;
  guest_record RECORD;
  guest_id_var UUID;
  signup_id UUID;
  result JSON;
BEGIN
  -- Get venue by slug (hardcoded for nuthatch for now)
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
