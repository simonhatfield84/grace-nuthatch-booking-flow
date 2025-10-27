-- Add widget_default_variant to venue_widget_settings
ALTER TABLE public.venue_widget_settings 
ADD COLUMN widget_default_variant TEXT NOT NULL DEFAULT 'standard';

-- Add constraint to ensure valid values
ALTER TABLE public.venue_widget_settings 
ADD CONSTRAINT widget_default_variant_check 
CHECK (widget_default_variant IN ('standard', 'serviceFirst'));

-- Create index for performance
CREATE INDEX idx_venue_widget_settings_variant 
ON public.venue_widget_settings(widget_default_variant);

-- Add variant to booking_attempts
ALTER TABLE public.booking_attempts 
ADD COLUMN variant TEXT;

-- Add constraint
ALTER TABLE public.booking_attempts 
ADD CONSTRAINT booking_attempts_variant_check 
CHECK (variant IN ('standard', 'serviceFirst'));

-- Add variant to bookings
ALTER TABLE public.bookings 
ADD COLUMN variant TEXT;

-- Add constraint
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_variant_check 
CHECK (variant IN ('standard', 'serviceFirst'));

-- Create indexes
CREATE INDEX idx_booking_attempts_variant ON public.booking_attempts(variant);
CREATE INDEX idx_bookings_variant ON public.bookings(variant);