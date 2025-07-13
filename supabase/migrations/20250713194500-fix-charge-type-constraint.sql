
-- Drop the existing constraint if it exists
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_charge_type_check;

-- Add the corrected constraint that allows 'none', 'all_reservations', and 'large_groups'
ALTER TABLE services ADD CONSTRAINT services_charge_type_check 
CHECK (charge_type IN ('none', 'all_reservations', 'large_groups'));

-- Update any existing services that have invalid charge_type values
UPDATE services 
SET charge_type = 'none' 
WHERE charge_type NOT IN ('none', 'all_reservations', 'large_groups') 
   OR charge_type IS NULL;

-- Set the default value for the charge_type column
ALTER TABLE services ALTER COLUMN charge_type SET DEFAULT 'none';
