
-- Create a storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Create RLS policies for the service images bucket
CREATE POLICY "Anyone can view service images" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Anyone can upload service images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Anyone can update service images" ON storage.objects
FOR UPDATE USING (bucket_id = 'service-images');

CREATE POLICY "Anyone can delete service images" ON storage.objects
FOR DELETE USING (bucket_id = 'service-images');

-- Create a services table to persist service data including images
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tag_ids UUID[] DEFAULT '{}',
  min_guests INTEGER NOT NULL DEFAULT 1,
  max_guests INTEGER NOT NULL DEFAULT 8,
  lead_time_hours INTEGER NOT NULL DEFAULT 2,
  cancellation_window_hours INTEGER NOT NULL DEFAULT 24,
  requires_deposit BOOLEAN NOT NULL DEFAULT false,
  deposit_per_guest INTEGER NOT NULL DEFAULT 0,
  online_bookable BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  secret_slug TEXT,
  terms_and_conditions TEXT DEFAULT '',
  duration_rules JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to the services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies for the services table (making it public for now since no auth is implemented)
CREATE POLICY "Anyone can view services" ON public.services
FOR SELECT USING (true);

CREATE POLICY "Anyone can create services" ON public.services
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update services" ON public.services
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete services" ON public.services
FOR DELETE USING (true);
