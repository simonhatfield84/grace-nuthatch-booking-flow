-- Phase 5: Fix resolve_order_review to properly handle visit_id (booking.id)
CREATE OR REPLACE FUNCTION public.resolve_order_review(
  p_review_id bigint,
  p_action text,
  p_visit_id uuid DEFAULT NULL,
  p_reservation_id uuid DEFAULT NULL,
  p_guest_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id TEXT;
BEGIN
  SELECT order_id INTO v_order_id 
  FROM public.order_link_reviews 
  WHERE id = p_review_id 
  FOR UPDATE;
  
  IF v_order_id IS NULL THEN 
    RAISE EXCEPTION 'review not found'; 
  END IF;

  IF p_action = 'link_to_visit' AND p_visit_id IS NOT NULL THEN
    -- Use visit_id (booking.id) for both fields, cast to TEXT for compatibility
    INSERT INTO public.order_links(order_id, visit_id, reservation_id, guest_id, link_method, confidence)
    VALUES (
      v_order_id, 
      p_visit_id::TEXT, 
      p_reservation_id, 
      p_guest_id, 
      'manual', 
      1.0
    )
    ON CONFLICT (order_id) DO UPDATE 
    SET 
      visit_id = EXCLUDED.visit_id,
      reservation_id = EXCLUDED.reservation_id,
      link_method = 'manual', 
      confidence = 1.0;
    
    -- Apply metrics if visit exists
    PERFORM grace_apply_order_to_visit_metrics(v_order_id, p_visit_id);
  ELSIF p_action = 'dismiss' THEN
    NULL;
  END IF;

  UPDATE public.order_link_reviews 
  SET status = 'resolved', resolved_at = now() 
  WHERE id = p_review_id;
END;
$function$;