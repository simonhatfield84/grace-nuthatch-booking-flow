-- Fix grace_create_walk_in to return INTEGER instead of UUID
-- This resolves the "cannot cast type integer to uuid" error when creating walk-ins from Square orders

-- Drop the existing function with wrong return type
DROP FUNCTION IF EXISTS public.grace_create_walk_in(UUID, INTEGER, INTEGER, UUID, TEXT, TIMESTAMPTZ);

-- Recreate with correct return type (INTEGER)
CREATE FUNCTION public.grace_create_walk_in(
  p_venue_id UUID,
  p_area_id INTEGER,         -- nullable section_id
  p_table_id INTEGER,        -- nullable table_id
  p_guest_id UUID,           -- nullable guest_id
  p_source TEXT,             -- 'other' or similar
  p_opened_at TIMESTAMPTZ    -- order.created_at
)
RETURNS INTEGER              -- Changed from UUID to INTEGER (bookings.id is INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id INTEGER;
  v_booking_date DATE;
  v_booking_time TIME;
  v_guest_name TEXT := 'Walk-in';
BEGIN
  -- Extract date and time from opened_at
  v_booking_date := p_opened_at::DATE;
  v_booking_time := p_opened_at::TIME;
  
  -- Get guest name if guest_id provided
  IF p_guest_id IS NOT NULL THEN
    SELECT name INTO v_guest_name 
    FROM guests 
    WHERE id = p_guest_id;
  END IF;
  
  -- Insert walk-in booking
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
    p_table_id,              -- Can be NULL if unassigned
    v_guest_name,
    2,                       -- Default party size (can be updated later)
    v_booking_date,
    v_booking_time,
    'seated',                -- Walk-ins start as seated
    p_source,
    'Walk-In',
    120,                     -- Default duration
    CASE 
      WHEN p_area_id IS NOT NULL THEN 'Auto-created from Square order (Section #' || p_area_id || ')'
      ELSE 'Auto-created from Square order'
    END,
    p_opened_at
  )
  RETURNING id INTO v_booking_id;
  
  -- Return as INTEGER (removed ::UUID cast that was causing the error)
  RETURN v_booking_id;
END;
$$;