
-- Create booking_windows table with enhanced features
CREATE TABLE public.booking_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{}',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_bookings_per_slot INTEGER NOT NULL DEFAULT 10,
  start_date DATE NULL,
  end_date DATE NULL,
  blackout_periods JSONB NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_windows ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (matching the existing pattern from other tables)
CREATE POLICY "Allow all users to view booking_windows" ON public.booking_windows
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to create booking_windows" ON public.booking_windows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update booking_windows" ON public.booking_windows
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete booking_windows" ON public.booking_windows
  FOR DELETE USING (true);

-- Create index for better query performance
CREATE INDEX idx_booking_windows_service_id ON public.booking_windows(service_id);
CREATE INDEX idx_booking_windows_dates ON public.booking_windows(start_date, end_date);
