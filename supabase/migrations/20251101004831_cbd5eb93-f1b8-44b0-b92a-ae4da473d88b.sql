-- Fix booking data issues and clean up duplicates

-- Fix 1: Update booking 304 with Nicky Peacock's information
UPDATE bookings 
SET guest_name = 'Nicky Peacock',
    email = 'nickypeacock@gmail.com',
    phone = '+447837988184',
    updated_at = now()
WHERE id = 304;

-- Fix 2: Delete booking 301 (empty duplicate on Table 12)
DELETE FROM bookings WHERE id = 301;

-- Fix 3: Clean up duplicate walk_in_creation_failed reviews
-- Keep only the first occurrence per order_id, delete the rest
WITH ranked_reviews AS (
  SELECT id, order_id,
         ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at ASC) as rn
  FROM order_link_reviews
  WHERE reason = 'walk_in_creation_failed'
    AND status = 'open'
)
DELETE FROM order_link_reviews
WHERE id IN (
  SELECT id FROM ranked_reviews WHERE rn > 1
);