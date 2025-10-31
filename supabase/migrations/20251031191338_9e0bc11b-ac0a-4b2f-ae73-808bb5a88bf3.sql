-- Link the existing Eve Lam walk-in (booking 261) to its Square order
INSERT INTO order_links (order_id, visit_id, reservation_id, guest_id, link_method, confidence)
VALUES (
  'P4vuNBslmgwHmvvq2Lmx96aHcdGZY',
  261,
  NULL,  -- Walk-ins have no reservation_id
  NULL,  -- Guest wasn't linked during creation
  'manual_migration',
  1.0
)
ON CONFLICT (order_id) DO NOTHING;