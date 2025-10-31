-- Add foreign key constraint from order_links to square_orders
-- This enables PostgREST to perform automatic joins using square_orders!inner() syntax

ALTER TABLE order_links
ADD CONSTRAINT fk_order_links_square_orders
FOREIGN KEY (order_id)
REFERENCES square_orders(order_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Verify the constraint was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_order_links_square_orders'
    AND table_name = 'order_links'
  ) THEN
    RAISE NOTICE 'Foreign key constraint fk_order_links_square_orders successfully created';
  ELSE
    RAISE EXCEPTION 'Foreign key constraint fk_order_links_square_orders was not created';
  END IF;
END $$;