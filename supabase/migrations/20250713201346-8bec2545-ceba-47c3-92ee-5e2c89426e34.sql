
-- Update RLS policies to allow public access for booking widget functionality

-- 1. Update venues table to allow public read access for approved venues
DROP POLICY IF EXISTS "Public can view approved venues" ON public.venues;
CREATE POLICY "Public can view approved venues" ON public.venues
  FOR SELECT USING (approval_status = 'approved');

-- 2. Update booking_windows table to allow public read access
DROP POLICY IF EXISTS "Public can view booking windows" ON public.booking_windows;
CREATE POLICY "Public can view booking windows" ON public.booking_windows
  FOR SELECT USING (true);

-- 3. Update services table to allow public read access for active, online bookable services
DROP POLICY IF EXISTS "Public can view active online bookable services" ON public.services;
CREATE POLICY "Public can view active online bookable services" ON public.services
  FOR SELECT USING (active = true AND online_bookable = true);

-- 4. Update tables table to allow public read access for availability checking
DROP POLICY IF EXISTS "Public can view online bookable tables" ON public.tables;
CREATE POLICY "Public can view online bookable tables" ON public.tables
  FOR SELECT USING (online_bookable = true AND status = 'active');

-- 5. Update bookings table to allow public read access for availability checking
DROP POLICY IF EXISTS "Public can view bookings for availability" ON public.bookings;
CREATE POLICY "Public can view bookings for availability" ON public.bookings
  FOR SELECT USING (true);
