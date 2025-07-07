
-- Remove payment-related columns from venue_stripe_settings table
-- Keep only connection and basic settings
ALTER TABLE venue_stripe_settings 
DROP COLUMN IF EXISTS charge_type,
DROP COLUMN IF EXISTS minimum_guests_for_charge,
DROP COLUMN IF EXISTS charge_amount_per_guest;

-- Update services table to ensure all services have proper payment defaults
-- Remove 'venue_default' option and set to 'none' for existing services
UPDATE services 
SET charge_type = 'none' 
WHERE charge_type = 'venue_default' OR charge_type IS NULL;

-- Make sure charge_type has a proper default
ALTER TABLE services 
ALTER COLUMN charge_type SET DEFAULT 'none';
