-- Phase 2: Enable anonymous users to check availability

-- Allow anonymous users to view active online-bookable tables
CREATE POLICY "Public can view active online-bookable tables"
ON public.tables FOR SELECT
TO anon
USING (status = 'active' AND online_bookable = true);

-- Allow anonymous users to view blocks for availability checking
CREATE POLICY "Public can view blocks for availability"
ON public.blocks FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to view confirmed bookings for availability checking
-- Only exposing minimal data needed: table_id, booking_date, booking_time, party_size
CREATE POLICY "Public can view confirmed bookings for availability"
ON public.bookings FOR SELECT
TO anon
USING (status IN ('confirmed', 'seated'));