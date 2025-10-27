-- Create venue_media table to track uploaded media assets
CREATE TABLE IF NOT EXISTS public.venue_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hero', 'about', 'logo_light', 'logo_dark')),
  path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  variants JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_venue_media_venue_type ON public.venue_media(venue_id, type);
CREATE INDEX idx_venue_media_sort ON public.venue_media(venue_id, type, sort_order);

-- Enable RLS
ALTER TABLE public.venue_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_media
CREATE POLICY "Venue users can view their media"
  ON public.venue_media FOR SELECT
  TO authenticated
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage their media"
  ON public.venue_media FOR ALL
  TO authenticated
  USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id))
  WITH CHECK (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Add logo_light and logo_dark columns to venue_branding table
ALTER TABLE public.venue_branding
ADD COLUMN IF NOT EXISTS logo_light TEXT,
ADD COLUMN IF NOT EXISTS logo_dark TEXT;

-- Create branding bucket for logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create venue-media bucket for hero/about images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-media',
  'venue-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public READ policies
CREATE POLICY "Public read branding"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "Public read venue-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'venue-media'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Branding bucket WRITE policies
CREATE POLICY "Venue users insert branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1]::uuid = get_user_venue(auth.uid())
  );

CREATE POLICY "Venue users update branding"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1]::uuid = get_user_venue(auth.uid())
  );

CREATE POLICY "Venue users delete branding"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1]::uuid = get_user_venue(auth.uid())
  );

-- Venue-media bucket WRITE policies
CREATE POLICY "Venue users insert venue-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'venue-media'
    AND (storage.foldername(name))[1]::uuid = get_user_venue(auth.uid())
  );

CREATE POLICY "Venue users update venue-media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'venue-media'
    AND (storage.foldername(name))[1]::uuid = get_user_venue(auth.uid())
  );

CREATE POLICY "Venue users delete venue-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'venue-media'
    AND (storage.foldername(name))[1]::uuid = get_user_venue(auth.uid())
  );