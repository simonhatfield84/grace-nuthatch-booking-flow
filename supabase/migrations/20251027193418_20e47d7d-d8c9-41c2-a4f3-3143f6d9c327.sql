-- ============================================================
-- Create restricted public views for services and booking windows
-- These views only expose data for approved venues with active services
-- ============================================================

-- ------------------------------------------------
-- 1. Services Public View
-- ------------------------------------------------

DROP VIEW IF EXISTS public.services_public;

CREATE OR REPLACE VIEW public.services_public AS
SELECT 
  s.id,
  s.venue_id,
  s.title,
  s.description,
  s.image_url,
  s.min_guests,
  s.max_guests,
  s.duration_rules,
  s.requires_deposit,
  s.deposit_per_guest,
  s.requires_payment,
  s.charge_amount_per_guest,
  s.charge_type,
  s.minimum_guests_for_charge,
  s.terms_and_conditions,
  s.lead_time_hours,
  s.cancellation_window_hours,
  s.active,
  s.online_bookable,
  s.created_at,
  s.updated_at
FROM public.services s
JOIN public.venues v ON v.id = s.venue_id
WHERE v.approval_status = 'approved' 
  AND s.active = true 
  AND s.online_bookable = true;

GRANT SELECT ON public.services_public TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.services_public FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS services_venue_active_bookable_idx
  ON public.services (venue_id, active, online_bookable)
  WHERE active = true AND online_bookable = true;

COMMENT ON VIEW public.services_public IS 'Public read-only view exposing only active, bookable services from approved venues. Used by booking widgets for anonymous users. Base services table remains protected by RLS for authenticated staff.';

-- ------------------------------------------------
-- 2. Booking Windows Public View
-- ------------------------------------------------

DROP VIEW IF EXISTS public.booking_windows_public;

CREATE OR REPLACE VIEW public.booking_windows_public AS
SELECT 
  bw.id,
  bw.venue_id,
  bw.service_id,
  bw.days,
  bw.start_time,
  bw.end_time,
  bw.start_date,
  bw.end_date,
  bw.blackout_periods,
  bw.max_bookings_per_slot,
  bw.created_at,
  bw.updated_at
FROM public.booking_windows bw
JOIN public.services s ON s.id = bw.service_id
JOIN public.venues v ON v.id = s.venue_id
WHERE v.approval_status = 'approved' 
  AND s.active = true 
  AND s.online_bookable = true;

GRANT SELECT ON public.booking_windows_public TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.booking_windows_public FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS booking_windows_service_venue_idx
  ON public.booking_windows (service_id, venue_id);

COMMENT ON VIEW public.booking_windows_public IS 'Public read-only view exposing booking windows for active, bookable services from approved venues. Used by booking widgets to determine service availability. Base booking_windows table remains protected by RLS for authenticated staff.';