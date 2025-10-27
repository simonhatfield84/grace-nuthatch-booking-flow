-- Add button_shape column to venue_branding
ALTER TABLE public.venue_branding
ADD COLUMN IF NOT EXISTS button_shape TEXT DEFAULT 'rounded'
CHECK (button_shape IN ('rounded', 'square'));

-- Migrate existing button_radius data to button_shape
UPDATE public.venue_branding
SET button_shape = CASE
  WHEN button_radius IN ('md', 'lg', 'full') THEN 'rounded'
  WHEN button_radius IN ('none', 'sm') THEN 'square'
  ELSE 'rounded'
END
WHERE button_shape IS NULL;

-- Ensure all existing venues have a branding row with sensible defaults
INSERT INTO public.venue_branding (venue_id, primary_color, secondary_color, accent_color, font_heading, font_body, button_shape)
SELECT 
  v.id,
  '#0ea5a0',
  '#111827',
  '#f59e0b',
  'Inter',
  'Inter',
  'rounded'
FROM public.venues v
LEFT JOIN public.venue_branding vb ON vb.venue_id = v.id
WHERE vb.venue_id IS NULL
ON CONFLICT (venue_id) DO NOTHING;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_venue_branding_venue_id ON public.venue_branding(venue_id);

COMMENT ON COLUMN public.venue_branding.button_shape IS 'Button corner style: rounded (full radius) or square (minimal radius)';