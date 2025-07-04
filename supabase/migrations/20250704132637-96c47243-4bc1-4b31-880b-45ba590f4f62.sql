
-- Phase 1: Add duration_minutes and end_time columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN duration_minutes INTEGER DEFAULT 120,
ADD COLUMN end_time TIME GENERATED ALWAYS AS (
  (booking_time::interval + (COALESCE(duration_minutes, 120) * interval '1 minute'))::time
) STORED;

-- Add helpful comment
COMMENT ON COLUMN public.bookings.duration_minutes IS 'Duration of the booking in minutes, calculated from service rules or manually set';
COMMENT ON COLUMN public.bookings.end_time IS 'Computed end time based on booking_time + duration_minutes';

-- Update existing bookings to have calculated durations based on service rules
-- This will be done in the application code to properly handle service rule lookup
