
-- Add public RLS policy to allow reading publishable Stripe keys for approved venues
CREATE POLICY "Public can view publishable stripe keys for approved venues" 
ON public.venue_stripe_settings 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.venues 
    WHERE venues.id = venue_stripe_settings.venue_id 
    AND venues.approval_status = 'approved'
  )
);
