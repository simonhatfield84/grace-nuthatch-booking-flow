-- Manually link existing bookings to their Square orders
INSERT INTO order_links (order_id, visit_id, link_method, confidence, created_at)
VALUES 
  ('nGW5h3F1SdAvoi4nCnUZWC26tuaZY', 246, 'manual_migration', 1.0, NOW()),
  ('N9cn1IPsMwyzS82nu9pcWBlpUmXZY', 247, 'manual_migration', 1.0, NOW()),
  ('FlEoRMbO8SC9DEXC9VSoZlf9DYEZY', 254, 'manual_migration', 1.0, NOW())
ON CONFLICT (order_id) DO NOTHING;

-- Round booking 247 to nearest 15-minute interval (18:36:50 -> 18:30:00)
UPDATE bookings
SET booking_time = '18:30:00'
WHERE id = 247;

-- Mark bookings as finished when their Square order has a completed payment
UPDATE bookings
SET 
  status = 'finished',
  updated_at = NOW()
WHERE id IN (247, 254)
  AND status IN ('seated', 'confirmed');