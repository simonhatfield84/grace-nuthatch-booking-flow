-- Add unique constraint to venue_settings table to enable proper upserts
ALTER TABLE public.venue_settings 
ADD CONSTRAINT venue_settings_venue_id_setting_key_unique 
UNIQUE (venue_id, setting_key);