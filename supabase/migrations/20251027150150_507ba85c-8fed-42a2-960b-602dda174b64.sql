-- 1. Ensure all approved venues have a venue_widget_settings row
INSERT INTO public.venue_widget_settings (venue_id, widget_default_variant, copy_json, flags_json)
SELECT 
  v.id,
  'standard',
  '{"holdBanner": {"title": "We''re holding your table", "subtitle": "Complete your details within {time}, or the hold releases automatically.", "urgentWarning": "⏰ Complete your booking soon!", "expiredTitle": "Time slot expired", "expiredMessage": "Please select a new time"}}'::jsonb,
  '{"showHero": true, "showAbout": true, "showAllergyNote": true, "showDepositExplainer": true}'::jsonb
FROM public.venues v
WHERE v.approval_status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM public.venue_widget_settings vws 
  WHERE vws.venue_id = v.id
)
ON CONFLICT (venue_id) DO NOTHING;

-- 2. Create public read-only view for widget settings
CREATE OR REPLACE VIEW public.venue_widget_settings_public AS
SELECT
  vws.venue_id,
  vws.widget_default_variant,
  vws.copy_json,
  vws.flags_json,
  vws.hero_image_url,
  vws.about_html
FROM public.venue_widget_settings vws
JOIN public.venues v ON v.id = vws.venue_id
WHERE v.approval_status = 'approved';

-- 3. Grant public read access
GRANT SELECT ON public.venue_widget_settings_public TO anon, authenticated;

-- 4. Add helpful comment
COMMENT ON VIEW public.venue_widget_settings_public IS 'Public read-only view of widget settings for approved venues. Used by booking widgets and public pages.';

-- 5. Update RLS on venue_widget_settings to allow SELECT for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view widget settings" ON public.venue_widget_settings;

CREATE POLICY "Authenticated users can view widget settings"
  ON public.venue_widget_settings FOR SELECT
  TO authenticated
  USING (venue_id = get_user_venue(auth.uid()));