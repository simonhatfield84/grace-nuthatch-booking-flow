
-- Fix order_links.visit_id type mismatch
-- visit_id should be INTEGER to match bookings.id, not UUID
-- Since order_links table is currently empty, we can safely drop and recreate the column

-- Drop foreign key constraint if it exists
ALTER TABLE order_links 
DROP CONSTRAINT IF EXISTS order_links_visit_id_fkey;

-- Drop the UUID column
ALTER TABLE order_links DROP COLUMN IF EXISTS visit_id;

-- Recreate as INTEGER
ALTER TABLE order_links 
ADD COLUMN visit_id INTEGER;

-- Add proper foreign key constraint to bookings table
ALTER TABLE order_links
ADD CONSTRAINT order_links_visit_id_fkey 
FOREIGN KEY (visit_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_links_order_id ON order_links(order_id);
CREATE INDEX IF NOT EXISTS idx_order_links_visit_id ON order_links(visit_id);

-- Ensure unique constraint on order_id (one order = one visit)
CREATE UNIQUE INDEX IF NOT EXISTS order_links_order_id_unique ON order_links(order_id);
