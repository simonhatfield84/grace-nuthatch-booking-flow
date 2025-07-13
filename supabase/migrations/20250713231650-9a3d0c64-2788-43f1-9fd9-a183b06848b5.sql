-- Create default terms setting for venues
INSERT INTO venue_settings (venue_id, setting_key, setting_value)
SELECT id, 'default_terms', '"By making a reservation, you agree to our standard booking terms. Cancellations must be made at least 24 hours in advance. No-shows may be charged a fee. Please arrive on time for your reservation."'::jsonb
FROM venues 
WHERE slug = 'the-nuthatch'
AND NOT EXISTS (
  SELECT 1 FROM venue_settings vs 
  WHERE vs.venue_id = venues.id 
  AND vs.setting_key = 'default_terms'
);