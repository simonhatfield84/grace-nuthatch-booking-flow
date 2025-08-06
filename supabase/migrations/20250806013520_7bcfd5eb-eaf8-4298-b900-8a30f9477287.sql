
-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.homepage_analytics_summary;

-- Recreate the view without SECURITY DEFINER to respect RLS policies
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
