-- Create function to backfill booking contact info and recalculate metrics
CREATE OR REPLACE FUNCTION public.backfill_booking_contacts_and_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count INTEGER;
  v_guest_ids UUID[];
  v_guest_id UUID;
BEGIN
  -- Backfill booking contact info from matching guests
  WITH updated AS (
    UPDATE bookings b
    SET 
      email = COALESCE(b.email, g.email),
      phone = COALESCE(b.phone, g.phone),
      updated_at = NOW()
    FROM guests g
    WHERE (
      (b.guest_name = g.name AND b.venue_id = g.venue_id) OR
      (b.email IS NOT NULL AND LOWER(b.email) = LOWER(g.email)) OR
      (b.phone IS NOT NULL AND b.phone = g.phone)
    )
    AND (b.email IS NULL OR b.phone IS NULL)
    AND b.status IN ('finished', 'seated', 'confirmed')
    RETURNING g.id as guest_id
  )
  SELECT ARRAY_AGG(DISTINCT guest_id), COUNT(*) 
  INTO v_guest_ids, v_updated_count
  FROM updated;
  
  -- Recalculate metrics for all affected guests
  IF v_guest_ids IS NOT NULL THEN
    FOREACH v_guest_id IN ARRAY v_guest_ids
    LOOP
      PERFORM update_guest_metrics(v_guest_id);
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'bookings_updated', COALESCE(v_updated_count, 0),
    'guests_refreshed', COALESCE(array_length(v_guest_ids, 1), 0)
  );
END;
$function$;