-- Fix the grace_create_walk_in function - correcting invalid TIME to TIMESTAMP cast
CREATE OR REPLACE FUNCTION public.grace_create_walk_in(
  p_venue_id uuid,
  p_area_id integer,
  p_table_id integer,
  p_guest_id uuid,
  p_source text,
  p_opened_at timestamp with time zone
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking_id INTEGER;
  v_booking_date DATE;
  v_booking_time TIME;
  v_guest_name TEXT := 'Walk-in';
  v_minute INTEGER;
  v_rounded_minute INTEGER;
BEGIN
  -- Extract date and time from opened_at
  v_booking_date := p_opened_at::DATE;
  v_booking_time := p_opened_at::TIME;
  
  -- Round time to nearest 15-minute interval for Grid view compatibility
  v_minute := EXTRACT(MINUTE FROM v_booking_time)::INTEGER;
  v_rounded_minute := ROUND(v_minute / 15.0) * 15;
  
  -- Handle edge case where rounding goes to 60
  IF v_rounded_minute = 60 THEN
    -- Add 1 hour and reset to top of hour
    v_booking_time := (v_booking_time - (v_minute || ' minutes')::INTERVAL + INTERVAL '1 hour');
  ELSE
    -- Set to rounded minute within the hour
    v_booking_time := DATE_TRUNC('hour', (CURRENT_DATE + v_booking_time)::TIMESTAMP)::TIME + 
                      (v_rounded_minute || ' minutes')::INTERVAL;
  END IF;
  
  -- Get guest name if guest_id provided
  IF p_guest_id IS NOT NULL THEN
    SELECT name INTO v_guest_name 
    FROM guests 
    WHERE id = p_guest_id;
  END IF;
  
  -- Insert walk-in booking with rounded time
  INSERT INTO bookings (
    venue_id,
    table_id,
    guest_name,
    party_size,
    booking_date,
    booking_time,
    status,
    source,
    service,
    duration_minutes,
    notes,
    created_at
  ) VALUES (
    p_venue_id,
    p_table_id,
    v_guest_name,
    2,
    v_booking_date,
    v_booking_time,
    'seated',
    p_source,
    'Walk-In',
    120,
    CASE 
      WHEN p_area_id IS NOT NULL THEN 'Auto-created from Square order (Section #' || p_area_id || ')'
      ELSE 'Auto-created from Square order'
    END,
    p_opened_at
  )
  RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$function$;

-- Create walk-in booking for Eve Lam (Table 4 / ID 7)
WITH new_booking AS (
  INSERT INTO bookings (
    venue_id,
    table_id,
    guest_name,
    party_size,
    booking_date,
    booking_time,
    status,
    source,
    service,
    duration_minutes,
    notes,
    created_at
  ) VALUES (
    '6d5d5f19-13a5-4325-9933-430fc3c03b6b',
    7,
    'Eve Lam',
    2,
    CURRENT_DATE,
    '19:00:00',
    'seated',
    'other',
    'Walk-In',
    120,
    'Auto-created from Square order (Ticket #4)',
    '2025-10-31 19:01:15+00'
  )
  RETURNING id
)
-- Link to Square order
INSERT INTO order_links (order_id, visit_id, guest_id, link_method, confidence)
SELECT 
  'zK1djV2zhjj8xS6VG4HJ3PvhvkOZY',
  id,
  '813fa990-ed5f-4fc9-a671-f24a601acf9b',
  'manual_migration',
  1.0
FROM new_booking;

-- Mark review task as resolved
UPDATE order_link_reviews
SET status = 'resolved', resolved_at = NOW()
WHERE order_id = 'zK1djV2zhjj8xS6VG4HJ3PvhvkOZY';