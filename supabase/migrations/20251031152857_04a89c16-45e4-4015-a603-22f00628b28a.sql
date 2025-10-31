-- Table: square_payments (track payment lifecycle)
CREATE TABLE IF NOT EXISTS public.square_payments (
  id BIGSERIAL PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  order_id TEXT,
  location_id TEXT,
  status TEXT, -- PENDING, APPROVED, COMPLETED, CANCELED, FAILED
  amount_money BIGINT, -- Minor units (e.g., 1050 = £10.50)
  tip_money BIGINT,
  approved_money BIGINT,
  total_money BIGINT,
  processing_fee_money BIGINT,
  refunded_money BIGINT,
  card_brand TEXT,
  card_last_4 TEXT,
  customer_id TEXT,
  note TEXT,
  receipt_url TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS square_payments_order_id_idx ON public.square_payments(order_id);
CREATE INDEX IF NOT EXISTS square_payments_status_idx ON public.square_payments(status);
CREATE INDEX IF NOT EXISTS square_payments_location_idx ON public.square_payments(location_id);

-- Table: square_order_line_items (itemized bill data)
CREATE TABLE IF NOT EXISTS public.square_order_line_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  line_item_uid TEXT, -- Square's unique ID for this line item
  name TEXT,
  catalog_object_id TEXT,
  variation_name TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  base_price_money BIGINT, -- Price per unit
  total_money BIGINT, -- Total for this line (quantity × price + mods)
  modifiers JSONB DEFAULT '[]'::jsonb, -- Array of modifier objects
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, line_item_uid, name, total_money)
);

CREATE INDEX IF NOT EXISTS square_order_line_items_order_idx ON public.square_order_line_items(order_id);