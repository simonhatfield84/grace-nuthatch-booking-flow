-- Create venue_link_builder table for widget link tracking
CREATE TABLE IF NOT EXISTS public.venue_link_builder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  utm JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  
  CONSTRAINT valid_slug_format CHECK (slug ~ '^[a-z0-9]{8}$')
);

-- Indexes for performance
CREATE INDEX idx_venue_link_builder_venue ON public.venue_link_builder(venue_id);
CREATE INDEX idx_venue_link_builder_slug ON public.venue_link_builder(slug);
CREATE INDEX idx_venue_link_builder_created_at ON public.venue_link_builder(created_at DESC);

-- Enable RLS
ALTER TABLE public.venue_link_builder ENABLE ROW LEVEL SECURITY;

-- Policy: Venue admins can manage their venue's links
CREATE POLICY "venue_admins_manage_links"
  ON public.venue_link_builder FOR ALL
  USING (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id))
  WITH CHECK (venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), venue_id));

-- Policy: All venue users can view their venue's links
CREATE POLICY "venue_users_view_links"
  ON public.venue_link_builder FOR SELECT
  USING (venue_id = get_user_venue(auth.uid()));