
-- Drop the existing constraint that only allows 'table' and 'group'
ALTER TABLE booking_priorities DROP CONSTRAINT IF EXISTS booking_priorities_item_type_check;

-- Add new constraint that allows 'table' and 'join_group' to match our code
ALTER TABLE booking_priorities ADD CONSTRAINT booking_priorities_item_type_check 
CHECK (item_type = ANY (ARRAY['table'::text, 'join_group'::text]));

-- Update any existing records that might have 'group' to 'join_group' for consistency
UPDATE booking_priorities SET item_type = 'join_group' WHERE item_type = 'group';
