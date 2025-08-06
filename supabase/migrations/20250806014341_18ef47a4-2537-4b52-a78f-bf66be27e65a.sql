
-- Fix the homepage_analytics_summary view ownership to resolve security_definer_view linter error
-- The issue is that the view is owned by postgres (superuser) which makes it inherit elevated privileges

-- Drop the existing view completely
DROP VIEW IF EXISTS public.homepage_analytics_summary CASCADE;

-- Recreate the view with the same logic
CREATE VIEW public.homepage_analytics_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as page_views,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(*) FILTER (WHERE event_type = 'bounce') as bounces,
  AVG(CASE 
    WHEN event_type = 'session_end' AND event_data->>'duration' IS NOT NULL 
    THEN (event_data->>'duration')::numeric 
  END) as avg_session_duration,
  json_agg(DISTINCT event_data->>'section_name') FILTER (WHERE event_type = 'section_view' AND event_data->>'section_name' IS NOT NULL) as viewed_sections
FROM public.homepage_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- CRITICAL: Change ownership to authenticator (non-superuser role)
-- This is the key fix - the view must be owned by authenticator, not postgres
ALTER VIEW public.homepage_analytics_summary OWNER TO authenticator;

-- Grant explicit SELECT permissions to ensure access works
GRANT SELECT ON public.homepage_analytics_summary TO authenticator;

-- Add documentation
COMMENT ON VIEW public.homepage_analytics_summary IS 'Analytics summary view - owned by authenticator to prevent SECURITY DEFINER issues';
