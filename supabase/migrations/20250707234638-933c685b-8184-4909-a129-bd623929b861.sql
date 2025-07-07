
-- Fix the charge_type default value and update existing records
UPDATE services 
SET charge_type = 'none' 
WHERE charge_type = 'venue_default' OR charge_type IS NULL;

-- Update the default value for new services
ALTER TABLE services 
ALTER COLUMN charge_type SET DEFAULT 'none';
