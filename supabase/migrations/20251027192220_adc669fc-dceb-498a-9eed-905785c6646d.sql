-- ============================================================
-- Create restricted public view for approved venues only
-- ============================================================

-- Drop existing view if it exists (idempotent)
DROP VIEW IF EXISTS public.venues_public;

-- Create the public view with only necessary columns
CREATE OR REPLACE VIEW public.venues_public AS
SELECT
  v.id,
  v.name,
  v.slug,
  v.approval_status,
  v.address,
  v.phone,
  v.email,
  v.created_at,
  v.updated_at
FROM public.venues v
WHERE v.approval_status = 'approved';

-- Grant read-only access to anonymous and authenticated users
GRANT SELECT ON public.venues_public TO anon, authenticated;

-- Explicitly revoke write permissions (defense in depth)
REVOKE INSERT, UPDATE, DELETE ON public.venues_public FROM anon, authenticated;

-- Add performance index for slug lookups on approved venues
CREATE INDEX IF NOT EXISTS venues_slug_approved_idx
  ON public.venues (slug)
  WHERE approval_status = 'approved';

-- Add comment for documentation
COMMENT ON VIEW public.venues_public IS 'Public read-only view exposing only approved venue information. Used by booking widgets and public-facing pages. Anonymous users cannot access the base venues table directly.';