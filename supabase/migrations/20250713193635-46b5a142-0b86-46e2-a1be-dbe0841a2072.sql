
-- Update the services table charge_type constraint to allow 'none' and remove 'venue_default'
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_charge_type_check;

-- Add the updated constraint with the correct valid values
ALTER TABLE services ADD CONSTRAINT services_charge_type_check 
CHECK (charge_type IN ('none', 'all_reservations', 'large_groups'));

-- Update any existing services that have 'venue_default' to use 'none' instead
UPDATE services 
SET charge_type = 'none' 
WHERE charge_type = 'venue_default' OR charge_type IS NULL;
