-- Fix update_guest_metrics - visit_id is INTEGER not TEXT
CREATE OR REPLACE FUNCTION public.update_guest_metrics(p_guest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_visit_count INTEGER;
  v_total_spend BIGINT;
  v_total_covers INTEGER;
  v_last_visit DATE;
  v_guest_email TEXT;
  v_guest_phone TEXT;
BEGIN
  -- Get guest contact info
  SELECT email, phone INTO v_guest_email, v_guest_phone
  FROM guests WHERE id = p_guest_id;

  -- Compute metrics from bookings + square orders
  -- Match by: order_links.guest_id OR booking email/phone
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
  WHERE (
    ol.guest_id = p_guest_id  -- Direct guest_id link
    OR (v_guest_email IS NOT NULL AND b.email IS NOT NULL AND LOWER(b.email) = LOWER(v_guest_email))  -- Email match
    OR (v_guest_phone IS NOT NULL AND b.phone IS NOT NULL AND b.phone = v_guest_phone)  -- Phone match
  )
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
$function$;