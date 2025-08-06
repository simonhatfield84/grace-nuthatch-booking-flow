
-- Drop the existing view
DROP VIEW IF EXISTS public.homepage_analytics_summary;

-- Recreate the view with proper security_invoker syntax
CREATE VIEW public.homepage_analytics_summary
WITH (security_invoker=on)
AS
SELECT 
  date,
  unique_visitors,
  page_views,
  sessions,
  bounces,
  avg_session_duration,
  viewed_sections
FROM (
  SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) FILTER (WHERE event_type = 'bounce') as bounces,
    AVG(EXTRACT(EPOCH FROM (
      MAX(created_at) OVER (PARTITION BY session_id) - 
      MIN(created_at) OVER (PARTITION BY session_id)
    ))) as avg_session_duration,
    json_agg(DISTINCT event_data->>'section') FILTER (WHERE event_type = 'section_view') as viewed_sections
  FROM public.homepage_analytics
  GROUP BY DATE(created_at)
) analytics_data;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.homepage_analytics_summary TO authenticated;

-- Add comment explaining security model
COMMENT ON VIEW public.homepage_analytics_summary IS 
'Homepage analytics summary view with security_invoker=on. Access is controlled by RLS policies on the underlying homepage_analytics table.';
