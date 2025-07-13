
-- Fix the charge_type constraint to allow 'none' as a valid value
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_charge_type_check;

-- Add the updated constraint that includes 'none'
ALTER TABLE public.services ADD CONSTRAINT services_charge_type_check 
CHECK (charge_type IN ('none', 'venue_default', 'all_reservations', 'large_groups'));

-- Update the default value to be consistent
ALTER TABLE public.services ALTER COLUMN charge_type SET DEFAULT 'none';
