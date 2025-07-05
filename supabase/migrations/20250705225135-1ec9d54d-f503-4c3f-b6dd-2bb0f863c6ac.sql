
-- Drop all existing overly permissive RLS policies
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Anyone can create services" ON public.services;
DROP POLICY IF EXISTS "Anyone can update services" ON public.services;
DROP POLICY IF EXISTS "Anyone can delete services" ON public.services;

DROP POLICY IF EXISTS "Allow all users to view tags" ON public.tags;
DROP POLICY IF EXISTS "Allow all users to create tags" ON public.tags;
DROP POLICY IF EXISTS "Allow all users to update tags" ON public.tags;
DROP POLICY IF EXISTS "Allow all users to delete tags" ON public.tags;

DROP POLICY IF EXISTS "Allow all users to view service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Allow all users to create service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Allow all users to update service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Allow all users to delete service_tags" ON public.service_tags;

DROP POLICY IF EXISTS "Allow all users to view booking_windows" ON public.booking_windows;
DROP POLICY IF EXISTS "Allow all users to create booking_windows" ON public.booking_windows;
DROP POLICY IF EXISTS "Allow all users to update booking_windows" ON public.booking_windows;
DROP POLICY IF EXISTS "Allow all users to delete booking_windows" ON public.booking_windows;

DROP POLICY IF EXISTS "Allow all users to view tables" ON public.tables;
DROP POLICY IF EXISTS "Allow all users to create tables" ON public.tables;
DROP POLICY IF EXISTS "Allow all users to update tables" ON public.tables;
DROP POLICY IF EXISTS "Allow all users to delete tables" ON public.tables;

DROP POLICY IF EXISTS "Allow all users to view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all users to create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all users to update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all users to delete bookings" ON public.bookings;

DROP POLICY IF EXISTS "Allow all users to view sections" ON public.sections;
DROP POLICY IF EXISTS "Allow all users to create sections" ON public.sections;
DROP POLICY IF EXISTS "Allow all users to update sections" ON public.sections;
DROP POLICY IF EXISTS "Allow all users to delete sections" ON public.sections;

DROP POLICY IF EXISTS "Allow all users to view guests" ON public.guests;
DROP POLICY IF EXISTS "Allow all users to create guests" ON public.guests;
DROP POLICY IF EXISTS "Allow all users to update guests" ON public.guests;
DROP POLICY IF EXISTS "Allow all users to delete guests" ON public.guests;

DROP POLICY IF EXISTS "Allow all users to view guest_tags" ON public.guest_tags;
DROP POLICY IF EXISTS "Allow all users to create guest_tags" ON public.guest_tags;
DROP POLICY IF EXISTS "Allow all users to update guest_tags" ON public.guest_tags;
DROP POLICY IF EXISTS "Allow all users to delete guest_tags" ON public.guest_tags;

DROP POLICY IF EXISTS "Allow all users to view venue_settings" ON public.venue_settings;
DROP POLICY IF EXISTS "Allow all users to create venue_settings" ON public.venue_settings;
DROP POLICY IF EXISTS "Allow all users to update venue_settings" ON public.venue_settings;
DROP POLICY IF EXISTS "Allow all users to delete venue_settings" ON public.venue_settings;

-- Create proper venue-scoped RLS policies for services
CREATE POLICY "Authenticated users can view services for public booking" 
  ON public.services FOR SELECT 
  USING (active = true AND online_bookable = true);

CREATE POLICY "Venue admins can manage their services" 
  ON public.services FOR ALL 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

-- Create proper RLS policies for tags
CREATE POLICY "Authenticated venue users can view tags" 
  ON public.tags FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can manage tags" 
  ON public.tags FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Create proper RLS policies for service_tags
CREATE POLICY "Authenticated venue users can view service_tags" 
  ON public.service_tags FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can manage service_tags" 
  ON public.service_tags FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Create proper RLS policies for booking_windows
CREATE POLICY "Public can view active booking windows" 
  ON public.booking_windows FOR SELECT 
  USING (true);

CREATE POLICY "Venue admins can manage booking_windows" 
  ON public.booking_windows FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Create proper RLS policies for tables
CREATE POLICY "Authenticated venue users can view tables" 
  ON public.tables FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can manage tables" 
  ON public.tables FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Create proper RLS policies for bookings
CREATE POLICY "Public can create bookings" 
  ON public.bookings FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated venue users can view their venue bookings" 
  ON public.bookings FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue users can manage bookings" 
  ON public.bookings FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can delete bookings" 
  ON public.bookings FOR DELETE 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Create proper RLS policies for sections
CREATE POLICY "Authenticated venue users can view sections" 
  ON public.sections FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can manage sections" 
  ON public.sections FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Create proper RLS policies for guests
CREATE POLICY "Authenticated venue users can view guests" 
  ON public.guests FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue users can manage guests" 
  ON public.guests FOR ALL 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

-- Create proper RLS policies for guest_tags
CREATE POLICY "Authenticated venue users can view guest_tags" 
  ON public.guest_tags FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue users can manage guest_tags" 
  ON public.guest_tags FOR ALL 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

-- Create proper RLS policies for venue_settings
CREATE POLICY "Authenticated venue users can view their venue settings" 
  ON public.venue_settings FOR SELECT 
  USING (auth.uid() IS NOT NULL AND get_user_venue(auth.uid()) IS NOT NULL);

CREATE POLICY "Venue admins can manage their venue settings" 
  ON public.venue_settings FOR ALL 
  USING (auth.uid() IS NOT NULL AND is_admin(auth.uid(), get_user_venue(auth.uid())));

-- Add venue_id column to tables that need venue isolation
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.booking_windows ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);
ALTER TABLE public.venue_settings ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id);

-- Update existing data to have proper venue_id (assuming single venue for now)
UPDATE public.services SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.tags SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.booking_windows SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.tables SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.bookings SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.sections SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.guests SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;
UPDATE public.venue_settings SET venue_id = (SELECT id FROM public.venues LIMIT 1) WHERE venue_id IS NULL;

-- Make venue_id required for future records
ALTER TABLE public.services ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.tags ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.booking_windows ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.tables ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.sections ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.guests ALTER COLUMN venue_id SET NOT NULL;
ALTER TABLE public.venue_settings ALTER COLUMN venue_id SET NOT NULL;

-- Update RLS policies to use venue_id for proper isolation
DROP POLICY IF EXISTS "Authenticated users can view services for public booking" ON public.services;
DROP POLICY IF EXISTS "Venue admins can manage their services" ON public.services;

CREATE POLICY "Public can view active services" 
  ON public.services FOR SELECT 
  USING (active = true AND online_bookable = true);

CREATE POLICY "Venue users can view their venue services" 
  ON public.services FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their venue services" 
  ON public.services FOR ALL 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Update other policies to use venue_id
DROP POLICY IF EXISTS "Authenticated venue users can view tags" ON public.tags;
DROP POLICY IF EXISTS "Venue admins can manage tags" ON public.tags;

CREATE POLICY "Venue users can view their venue tags" 
  ON public.tags FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their venue tags" 
  ON public.tags FOR ALL 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Continue with other tables...
DROP POLICY IF EXISTS "Authenticated venue users can view tables" ON public.tables;
DROP POLICY IF EXISTS "Venue admins can manage tables" ON public.tables;

CREATE POLICY "Venue users can view their venue tables" 
  ON public.tables FOR SELECT 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their venue tables" 
  ON public.tables FOR ALL 
  USING (auth.uid() IS NOT NULL AND venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));
