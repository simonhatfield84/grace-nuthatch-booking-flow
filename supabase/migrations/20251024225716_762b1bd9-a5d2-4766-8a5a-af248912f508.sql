-- =====================================================
-- Migration: Remove WiFi Feature
-- Date: 2025-01-24
-- Description: Removes all WiFi-related tables, functions, and columns
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Drop WiFi-related functions
-- =====================================================

-- Drop functions (ignore if not found)
DROP FUNCTION IF EXISTS public.generate_wifi_session_token() CASCADE;
DROP FUNCTION IF EXISTS public.track_wifi_connection(
  p_venue_id uuid,
  p_device_fingerprint text,
  p_device_type text,
  p_device_os text,
  p_device_browser text,
  p_user_agent text,
  p_ip_address inet,
  p_guest_id uuid
) CASCADE;
DROP FUNCTION IF EXISTS public.create_default_wifi_settings(p_venue_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_wifi_portal_submission(
  p_venue_slug text,
  p_full_name text,
  p_email text,
  p_mobile_number text,
  p_date_of_birth date,
  p_marketing_consent boolean,
  p_client_mac text,
  p_ap_mac text,
  p_ssid_name text,
  p_radio_id text,
  p_site text,
  p_origin_url text,
  p_ip_address inet,
  p_user_agent text
) CASCADE;

-- =====================================================
-- 2. Drop WiFi-related columns from guests table
-- =====================================================

-- Drop columns on guests table (safe with IF EXISTS)
ALTER TABLE IF EXISTS public.guests 
  DROP COLUMN IF EXISTS wifi_signup_source CASCADE,
  DROP COLUMN IF EXISTS wifi_last_connected CASCADE,
  DROP COLUMN IF EXISTS device_fingerprint CASCADE;

-- =====================================================
-- 3. Drop WiFi tables (order matters due to FKs)
-- =====================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS public.wifi_analytics CASCADE;
DROP TABLE IF EXISTS public.wifi_sessions CASCADE;
DROP TABLE IF EXISTS public.wifi_devices CASCADE;
DROP TABLE IF EXISTS public.wifi_signups CASCADE;
DROP TABLE IF EXISTS public.wifi_settings CASCADE;

-- =====================================================
-- 4. Verify cleanup
-- =====================================================

-- Log the cleanup (for migration verification)
DO $$
BEGIN
  RAISE NOTICE 'WiFi feature removed successfully at %', NOW();
  RAISE NOTICE 'Tables dropped: wifi_analytics, wifi_sessions, wifi_devices, wifi_signups, wifi_settings';
  RAISE NOTICE 'Functions dropped: generate_wifi_session_token, track_wifi_connection, create_default_wifi_settings, handle_wifi_portal_submission';
  RAISE NOTICE 'Guest columns dropped: wifi_signup_source, wifi_last_connected, device_fingerprint';
END $$;

COMMIT;