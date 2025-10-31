-- Square webhook events (raw events with signature validation)
CREATE TABLE IF NOT EXISTS public.square_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  location_id TEXT,
  resource_id TEXT,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS square_webhook_events_event_id_uidx ON public.square_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS square_webhook_events_status_idx ON public.square_webhook_events(status);

-- Enable RLS
ALTER TABLE public.square_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_webhook_events ON public.square_webhook_events
  FOR ALL USING (true) WITH CHECK (true);

-- Square event retry queue
CREATE TABLE IF NOT EXISTS public.square_event_queue (
  id BIGSERIAL PRIMARY KEY,
  webhook_event_id BIGINT NOT NULL REFERENCES public.square_webhook_events(id) ON DELETE CASCADE,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 8,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS square_event_queue_next_attempt_idx ON public.square_event_queue(next_attempt_at);

-- Enable RLS
ALTER TABLE public.square_event_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_event_queue ON public.square_event_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Square orders snapshot
CREATE TABLE IF NOT EXISTS public.square_orders (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  location_id TEXT,
  state TEXT,
  source TEXT,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  total_money BIGINT,
  tip_money BIGINT,
  discount_money BIGINT,
  service_charge_money BIGINT,
  taxes_money BIGINT,
  version BIGINT,
  customer_id TEXT,
  note TEXT,
  raw JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS square_orders_customer_idx ON public.square_orders(customer_id);
CREATE INDEX IF NOT EXISTS square_orders_opened_idx ON public.square_orders(opened_at);
CREATE INDEX IF NOT EXISTS square_orders_state_idx ON public.square_orders(state);

-- Enable RLS
ALTER TABLE public.square_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY venue_staff_read_orders ON public.square_orders
  FOR SELECT USING (true);

CREATE POLICY service_role_all_orders ON public.square_orders
  FOR ALL USING (true) WITH CHECK (true);

-- Order links (junction table)
CREATE TABLE IF NOT EXISTS public.order_links (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_id TEXT,
  visit_id UUID,
  reservation_id UUID,
  guest_id UUID,
  link_method TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, visit_id)
);

CREATE INDEX IF NOT EXISTS order_links_order_idx ON public.order_links(order_id);
CREATE INDEX IF NOT EXISTS order_links_visit_idx ON public.order_links(visit_id);

-- Enable RLS
ALTER TABLE public.order_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY venue_staff_read_links ON public.order_links
  FOR SELECT USING (true);

CREATE POLICY service_role_all_links ON public.order_links
  FOR ALL USING (true) WITH CHECK (true);

-- Order link reviews (admin queue)
CREATE TABLE IF NOT EXISTS public.order_link_reviews (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT,
  payment_id TEXT,
  proposed_reservation_id UUID,
  proposed_guest_id UUID,
  proposed_visit_id UUID,
  reason TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.0,
  suggested_actions JSONB,
  snapshot JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS order_link_reviews_status_idx ON public.order_link_reviews(status);

-- Enable RLS
ALTER TABLE public.order_link_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_reviews ON public.order_link_reviews
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Add Square fields to guests table
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS square_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS square_reference_id TEXT,
  ADD COLUMN IF NOT EXISTS square_customer_raw JSONB;

CREATE INDEX IF NOT EXISTS guests_square_customer_id_idx ON public.guests(square_customer_id);

-- Database function: Find active visit by Square customer ID
CREATE OR REPLACE FUNCTION public.grace_find_active_visit_by_square_customer(p_customer_id TEXT)
RETURNS TABLE(visit_id UUID, reservation_id UUID, guest_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find bookings for today with matching Square customer
  RETURN QUERY
  SELECT 
    NULL::UUID as visit_id,  -- visit_id placeholder (no visits table yet)
    b.id::UUID as reservation_id,
    g.id as guest_id
  FROM public.bookings b
  JOIN public.guests g ON (
    (b.email IS NOT NULL AND LOWER(b.email) = LOWER(g.email)) OR
    (b.phone IS NOT NULL AND b.phone = g.phone)
  )
  WHERE g.square_customer_id = p_customer_id
    AND b.booking_date = CURRENT_DATE
    AND b.status IN ('confirmed', 'seated')
  LIMIT 1;
END;
$$;

-- Database function: Find visit by booking code
CREATE OR REPLACE FUNCTION public.grace_find_visit_by_booking_code(p_code TEXT)
RETURNS TABLE(visit_id UUID, reservation_id UUID, guest_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find booking by reference code
  RETURN QUERY
  SELECT 
    NULL::UUID as visit_id,  -- visit_id placeholder
    b.id::UUID as reservation_id,
    NULL::UUID as guest_id  -- We don't have direct guest_id in bookings table
  FROM public.bookings b
  WHERE b.booking_reference = p_code
    AND b.booking_date = CURRENT_DATE
    AND b.status IN ('confirmed', 'seated', 'finished')
  LIMIT 1;
END;
$$;

-- Database function: Apply order to visit metrics (stub)
CREATE OR REPLACE FUNCTION public.grace_apply_order_to_visit_metrics(p_order_id TEXT, p_visit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Stub implementation for thin slice
  -- Future: Update visit metrics, spending, etc.
  -- For now: Just log the association
  RAISE NOTICE 'Order % linked to visit %', p_order_id, p_visit_id;
END;
$$;

-- Database function: Resolve order review
CREATE OR REPLACE FUNCTION public.resolve_order_review(
  p_review_id BIGINT, 
  p_action TEXT, 
  p_visit_id UUID DEFAULT NULL, 
  p_reservation_id UUID DEFAULT NULL, 
  p_guest_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    INSERT INTO public.order_links(order_id, visit_id, reservation_id, guest_id, link_method, confidence)
    VALUES (v_order_id, p_visit_id, p_reservation_id, p_guest_id, 'manual', 1.0)
    ON CONFLICT (order_id, visit_id) DO UPDATE 
    SET link_method = 'manual', confidence = 1.0;
    
    PERFORM grace_apply_order_to_visit_metrics(v_order_id, p_visit_id);
  ELSIF p_action = 'dismiss' THEN
    -- No link created
    NULL;
  END IF;

  UPDATE public.order_link_reviews 
  SET status = 'resolved', resolved_at = now() 
  WHERE id = p_review_id;
END;
$$;