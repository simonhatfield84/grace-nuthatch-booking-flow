
-- Create table for tiered duration rules by party size
CREATE TABLE public.service_duration_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id BIGINT NOT NULL,
  min_guests INTEGER NOT NULL,
  max_guests INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_service_duration_rules_service FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT valid_guest_range CHECK (min_guests <= max_guests),
  CONSTRAINT positive_duration CHECK (duration_minutes > 0)
);

-- Add new fields to services table for enhanced functionality
ALTER TABLE public.services 
ADD COLUMN is_secret BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN secret_slug TEXT UNIQUE,
ADD COLUMN terms_and_conditions TEXT,
ADD COLUMN cancellation_window_hours INTEGER NOT NULL DEFAULT 24,
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Create index for better performance on secret slug lookups
CREATE INDEX idx_services_secret_slug ON public.services(secret_slug) WHERE secret_slug IS NOT NULL;

-- Create index for service duration rules
CREATE INDEX idx_service_duration_rules_service_id ON public.service_duration_rules(service_id);

-- Enable RLS on the new table
ALTER TABLE public.service_duration_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_duration_rules (assuming admin access for now)
CREATE POLICY "Allow all operations on service_duration_rules" 
  ON public.service_duration_rules 
  FOR ALL 
  USING (true);

-- Create a function to generate unique secret slugs
CREATE OR REPLACE FUNCTION public.generate_secret_slug()
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character slug
    slug := lower(
      substr(
        encode(gen_random_bytes(6), 'base64'),
        1, 8
      )
    );
    -- Replace any non-alphanumeric characters
    slug := regexp_replace(slug, '[^a-z0-9]', '', 'g');
    
    -- Check if slug already exists
    SELECT EXISTS(
      SELECT 1 FROM public.services WHERE secret_slug = slug
    ) INTO exists_check;
    
    -- If slug doesn't exist, return it
    IF NOT exists_check THEN
      RETURN slug;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for service media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-media', 'service-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for service media
CREATE POLICY "Allow public read access to service media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-media');

CREATE POLICY "Allow authenticated insert to service media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-media');

CREATE POLICY "Allow authenticated update to service media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'service-media');

CREATE POLICY "Allow authenticated delete from service media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'service-media');
