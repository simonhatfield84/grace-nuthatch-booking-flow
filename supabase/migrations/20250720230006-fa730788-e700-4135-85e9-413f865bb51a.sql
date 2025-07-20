
-- Add public RLS policy for venue_stripe_settings to allow unauthenticated payment processing
CREATE POLICY "Public can view payment settings for booking" ON public.venue_stripe_settings
  FOR SELECT 
  USING (is_active = true);
