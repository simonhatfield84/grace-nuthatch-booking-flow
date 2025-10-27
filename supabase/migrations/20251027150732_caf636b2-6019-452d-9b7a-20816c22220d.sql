-- 1. Create venue_branding_public view
CREATE OR REPLACE VIEW public.venue_branding_public AS
SELECT
  vb.venue_id,
  vb.logo_light,
  vb.logo_dark,
  vb.primary_color,
  vb.secondary_color,
  vb.accent_color,
  vb.font_heading,
  vb.font_body,
  vb.button_shape
FROM public.venue_branding vb
JOIN public.venues v ON v.id = vb.venue_id
WHERE v.approval_status = 'approved';

-- 2. Create venue_media_public view
CREATE OR REPLACE VIEW public.venue_media_public AS
SELECT
  vm.id,
  vm.venue_id,
  vm.type,
  vm.path,
  vm.width,
  vm.height,
  vm.sort_order
FROM public.venue_media vm
JOIN public.venues v ON v.id = vm.venue_id
WHERE v.approval_status = 'approved';

-- 3. Grant public read access
GRANT SELECT ON public.venue_branding_public TO anon, authenticated;
GRANT SELECT ON public.venue_media_public TO anon, authenticated;

-- 4. Add helpful comments
COMMENT ON VIEW public.venue_branding_public IS 'Public read-only view of branding for approved venues';
COMMENT ON VIEW public.venue_media_public IS 'Public read-only view of media assets for approved venues';