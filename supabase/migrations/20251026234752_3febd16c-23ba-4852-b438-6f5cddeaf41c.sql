-- ============================================================
-- V4 Branding Tables Migration
-- Safe to rollback: DROP TABLE in reverse order
-- ============================================================

-- Table 1: venue_branding (per-venue visual identity)
CREATE TABLE IF NOT EXISTS public.venue_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL UNIQUE REFERENCES public.venues(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0ea5a0',
  secondary_color TEXT NOT NULL DEFAULT '#111827',
  accent_color TEXT NOT NULL DEFAULT '#f59e0b',
  font_heading TEXT NOT NULL DEFAULT 'Inter',
  font_body TEXT NOT NULL DEFAULT 'Inter',
  button_radius TEXT NOT NULL DEFAULT 'md',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_colors CHECK (
    primary_color ~ '^#[0-9a-fA-F]{6}$' AND
    secondary_color ~ '^#[0-9a-fA-F]{6}$' AND
    accent_color ~ '^#[0-9a-fA-F]{6}$'
  ),
  CONSTRAINT valid_fonts CHECK (
    font_heading IN ('Inter', 'Poppins', 'Playfair Display', 'Karla', 'Roboto', 'Lato') AND
    font_body IN ('Inter', 'Poppins', 'Playfair Display', 'Karla', 'Roboto', 'Lato')
  ),
  CONSTRAINT valid_button_radius CHECK (
    button_radius IN ('sm', 'md', 'lg', 'full')
  )
);

-- Table 2: venue_widget_settings (per-venue widget content)
CREATE TABLE IF NOT EXISTS public.venue_widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL UNIQUE REFERENCES public.venues(id) ON DELETE CASCADE,
  hero_image_url TEXT,
  about_html TEXT,
  copy_json JSONB NOT NULL DEFAULT '{
    "heroHeading": "Book Your Experience",
    "heroSubheading": "Reserve your table in just a few clicks",
    "ctaText": "Book Now",
    "emptyStateHeading": "No Availability",
    "emptyStateMessage": "Please try another date or contact us directly.",
    "depositExplainer": "A small deposit secures your booking and will be deducted from your final bill.",
    "allergyNote": "Please inform staff of any dietary requirements upon arrival."
  }'::jsonb,
  flags_json JSONB NOT NULL DEFAULT '{
    "showHero": true,
    "showAbout": true,
    "showDepositExplainer": true,
    "showAllergyNote": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_venue_branding_venue_id ON public.venue_branding(venue_id);
CREATE INDEX idx_venue_widget_settings_venue_id ON public.venue_widget_settings(venue_id);

-- RLS
ALTER TABLE public.venue_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_widget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_admins_manage_branding"
  ON public.venue_branding FOR ALL
  USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id))
  WITH CHECK (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

CREATE POLICY "venue_admins_manage_widget_settings"
  ON public.venue_widget_settings FOR ALL
  USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id))
  WITH CHECK (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Public view
CREATE OR REPLACE VIEW public.venue_widget_public_v4 AS
SELECT
  v.slug AS venue_slug,
  v.name AS venue_name,
  COALESCE(b.logo_url, '') AS logo_url,
  COALESCE(b.primary_color, '#0ea5a0') AS primary_color,
  COALESCE(b.secondary_color, '#111827') AS secondary_color,
  COALESCE(b.accent_color, '#f59e0b') AS accent_color,
  COALESCE(b.font_heading, 'Inter') AS font_heading,
  COALESCE(b.font_body, 'Inter') AS font_body,
  COALESCE(b.button_radius, 'md') AS button_radius,
  COALESCE(s.hero_image_url, '') AS hero_image_url,
  COALESCE(s.about_html, '') AS about_html,
  COALESCE(s.copy_json, '{}'::jsonb) AS copy_json,
  COALESCE(s.flags_json, '{}'::jsonb) AS flags_json
FROM public.venues v
LEFT JOIN public.venue_branding b ON b.venue_id = v.id
LEFT JOIN public.venue_widget_settings s ON s.venue_id = v.id
WHERE v.approval_status = 'approved';

GRANT SELECT ON public.venue_widget_public_v4 TO anon, authenticated;

-- Seed The Nuthatch
INSERT INTO public.venue_branding (venue_id, logo_url, primary_color, secondary_color, accent_color)
SELECT 
  id, 
  '/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png',
  '#10b981',
  '#1e293b',
  '#f59e0b'
FROM public.venues 
WHERE slug = 'the-nuthatch'
ON CONFLICT (venue_id) DO NOTHING;

INSERT INTO public.venue_widget_settings (venue_id)
SELECT id FROM public.venues WHERE slug = 'the-nuthatch'
ON CONFLICT (venue_id) DO NOTHING;

-- Auto-seed trigger
CREATE OR REPLACE FUNCTION public.create_venue_branding_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.venue_branding (venue_id)
  VALUES (NEW.id)
  ON CONFLICT (venue_id) DO NOTHING;
  
  INSERT INTO public.venue_widget_settings (venue_id)
  VALUES (NEW.id)
  ON CONFLICT (venue_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_venue_branding_defaults_trigger
  AFTER INSERT ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.create_venue_branding_defaults();