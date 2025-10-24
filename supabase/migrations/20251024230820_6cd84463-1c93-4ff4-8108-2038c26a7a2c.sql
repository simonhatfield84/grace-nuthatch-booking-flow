-- =====================================================
-- Tenancy Hardening Pass 1: Add venue_id to Join Tables
-- Date: 2025-10-24
-- Description: Add venue_id columns to booking_payments, booking_tokens,
--              service_tags, and guest_tags for better multi-tenancy isolation
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Add venue_id columns with temporary defaults
-- =====================================================

-- Add venue_id to booking_payments
ALTER TABLE public.booking_payments
  ADD COLUMN venue_id uuid;

-- Add venue_id to booking_tokens
ALTER TABLE public.booking_tokens
  ADD COLUMN venue_id uuid;

-- Add venue_id to service_tags
ALTER TABLE public.service_tags
  ADD COLUMN venue_id uuid;

-- Add venue_id to guest_tags
ALTER TABLE public.guest_tags
  ADD COLUMN venue_id uuid;

-- =====================================================
-- 2. Backfill venue_id from parent tables
-- =====================================================

-- Backfill booking_payments.venue_id from bookings.venue_id
UPDATE public.booking_payments bp
SET venue_id = b.venue_id
FROM public.bookings b
WHERE bp.booking_id = b.id;

-- Backfill booking_tokens.venue_id from bookings.venue_id
UPDATE public.booking_tokens bt
SET venue_id = b.venue_id
FROM public.bookings b
WHERE bt.booking_id = b.id;

-- Backfill service_tags.venue_id from services.venue_id
UPDATE public.service_tags st
SET venue_id = s.venue_id
FROM public.services s
WHERE st.service_id = s.id;

-- Backfill guest_tags.venue_id from guests.venue_id
UPDATE public.guest_tags gt
SET venue_id = g.venue_id
FROM public.guests g
WHERE gt.guest_id = g.id;

-- =====================================================
-- 3. Make venue_id NOT NULL and add FK constraints
-- =====================================================

-- booking_payments
ALTER TABLE public.booking_payments
  ALTER COLUMN venue_id SET NOT NULL,
  ADD CONSTRAINT fk_booking_payments_venue
    FOREIGN KEY (venue_id)
    REFERENCES public.venues(id)
    ON DELETE CASCADE;

-- booking_tokens
ALTER TABLE public.booking_tokens
  ALTER COLUMN venue_id SET NOT NULL,
  ADD CONSTRAINT fk_booking_tokens_venue
    FOREIGN KEY (venue_id)
    REFERENCES public.venues(id)
    ON DELETE CASCADE;

-- service_tags
ALTER TABLE public.service_tags
  ALTER COLUMN venue_id SET NOT NULL,
  ADD CONSTRAINT fk_service_tags_venue
    FOREIGN KEY (venue_id)
    REFERENCES public.venues(id)
    ON DELETE CASCADE;

-- guest_tags
ALTER TABLE public.guest_tags
  ALTER COLUMN venue_id SET NOT NULL,
  ADD CONSTRAINT fk_guest_tags_venue
    FOREIGN KEY (venue_id)
    REFERENCES public.venues(id)
    ON DELETE CASCADE;

-- =====================================================
-- 4. Create indexes for venue_id columns
-- =====================================================

CREATE INDEX idx_booking_payments_venue_id ON public.booking_payments(venue_id);
CREATE INDEX idx_booking_tokens_venue_id ON public.booking_tokens(venue_id);
CREATE INDEX idx_service_tags_venue_id ON public.service_tags(venue_id);
CREATE INDEX idx_guest_tags_venue_id ON public.guest_tags(venue_id);

-- =====================================================
-- 5. Verification queries (logged as notices)
-- =====================================================

DO $$
DECLARE
  bp_null_count INTEGER;
  bt_null_count INTEGER;
  st_null_count INTEGER;
  gt_null_count INTEGER;
  bp_count INTEGER;
  bt_count INTEGER;
  st_count INTEGER;
  gt_count INTEGER;
BEGIN
  -- Count null venue_ids (should be 0)
  SELECT COUNT(*) INTO bp_null_count FROM public.booking_payments WHERE venue_id IS NULL;
  SELECT COUNT(*) INTO bt_null_count FROM public.booking_tokens WHERE venue_id IS NULL;
  SELECT COUNT(*) INTO st_null_count FROM public.service_tags WHERE venue_id IS NULL;
  SELECT COUNT(*) INTO gt_null_count FROM public.guest_tags WHERE venue_id IS NULL;
  
  -- Count total rows
  SELECT COUNT(*) INTO bp_count FROM public.booking_payments;
  SELECT COUNT(*) INTO bt_count FROM public.booking_tokens;
  SELECT COUNT(*) INTO st_count FROM public.service_tags;
  SELECT COUNT(*) INTO gt_count FROM public.guest_tags;
  
  RAISE NOTICE '=== Tenancy Hardening Pass 1 Complete ===';
  RAISE NOTICE 'booking_payments: % rows backfilled, % nulls', bp_count, bp_null_count;
  RAISE NOTICE 'booking_tokens: % rows backfilled, % nulls', bt_count, bt_null_count;
  RAISE NOTICE 'service_tags: % rows backfilled, % nulls', st_count, st_null_count;
  RAISE NOTICE 'guest_tags: % rows backfilled, % nulls', gt_count, gt_null_count;
  RAISE NOTICE 'Indexes created: 4';
  RAISE NOTICE 'Foreign key constraints added: 4';
END $$;

COMMIT;