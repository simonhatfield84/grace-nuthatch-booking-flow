-- Update grace_create_walk_in to populate email/phone from guest record
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
  v_guest_email TEXT := NULL;
  v_guest_phone TEXT := NULL;
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
    v_booking_time := (v_booking_time - (v_minute || ' minutes')::INTERVAL + INTERVAL '1 hour');
  ELSE
    v_booking_time := DATE_TRUNC('hour', (CURRENT_DATE + v_booking_time)::TIMESTAMP)::TIME + 
                      (v_rounded_minute || ' minutes')::INTERVAL;
  END IF;
  
  -- Get guest info if guest_id provided
  IF p_guest_id IS NOT NULL THEN
    SELECT name, email, phone INTO v_guest_name, v_guest_email, v_guest_phone
    FROM guests 
    WHERE id = p_guest_id;
  END IF;
  
  -- Insert walk-in booking with rounded time and contact info
  INSERT INTO bookings (
    venue_id,
    table_id,
    guest_name,
    email,
    phone,
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
    v_guest_email,
    v_guest_phone,
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