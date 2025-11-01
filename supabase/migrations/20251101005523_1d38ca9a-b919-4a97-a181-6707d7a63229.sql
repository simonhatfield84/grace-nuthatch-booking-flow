-- Add guest profile metrics columns
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS actual_visit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spend_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_spend_per_visit_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_spend_per_cover_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_actual_visit_date DATE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_guests_visit_metrics 
ON guests(actual_visit_count, total_spend_cents);

-- Create function to compute and update guest metrics
CREATE OR REPLACE FUNCTION update_guest_metrics(p_guest_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visit_count INTEGER;
  v_total_spend BIGINT;
  v_total_covers INTEGER;
  v_last_visit DATE;
BEGIN
  -- Compute metrics from bookings + square orders
  SELECT 
    COUNT(DISTINCT b.id),
    COALESCE(SUM(so.total_money), 0),
    SUM(b.party_size),
    MAX(b.booking_date)
  INTO 
    v_visit_count,
    v_total_spend,
    v_total_covers,
    v_last_visit
  FROM bookings b
  LEFT JOIN order_links ol ON ol.visit_id = b.id
  LEFT JOIN square_orders so ON ol.order_id = so.order_id AND so.state = 'COMPLETED'
  WHERE (b.email = (SELECT email FROM guests WHERE id = p_guest_id)
         OR b.phone = (SELECT phone FROM guests WHERE id = p_guest_id))
    AND b.status IN ('finished', 'seated');

  -- Update guest record
  UPDATE guests
  SET 
    actual_visit_count = v_visit_count,
    total_spend_cents = v_total_spend,
    average_spend_per_visit_cents = CASE 
      WHEN v_visit_count > 0 THEN (v_total_spend / v_visit_count)::INTEGER
      ELSE 0 
    END,
    average_spend_per_cover_cents = CASE 
      WHEN v_total_covers > 0 THEN (v_total_spend / v_total_covers)::INTEGER
      ELSE 0 
    END,
    last_actual_visit_date = v_last_visit,
    updated_at = NOW()
  WHERE id = p_guest_id;
END;
$$;

-- Backfill metrics for all existing guests with bookings
DO $$
DECLARE
  guest_record RECORD;
BEGIN
  FOR guest_record IN 
    SELECT DISTINCT g.id 
    FROM guests g
    JOIN bookings b ON (b.email = g.email OR b.phone = g.phone)
    WHERE b.status IN ('finished', 'seated')
  LOOP
    PERFORM update_guest_metrics(guest_record.id);
  END LOOP;
END $$;