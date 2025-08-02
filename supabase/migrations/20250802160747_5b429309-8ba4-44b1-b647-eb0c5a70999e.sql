
-- Create table for homepage analytics tracking
CREATE TABLE public.homepage_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL, -- Anonymous visitor identifier
  session_id text NOT NULL, -- Session identifier
  event_type text NOT NULL, -- 'page_view', 'section_view', 'bounce', 'exit'
  event_data jsonb DEFAULT '{}', -- Additional event data (section_name, scroll_depth, etc.)
  referrer text, -- Where the visitor came from
  user_agent text, -- Browser/device info
  viewport_width integer, -- Screen width for device analytics
  viewport_height integer, -- Screen height for device analytics
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_homepage_analytics_visitor_id ON public.homepage_analytics(visitor_id);
CREATE INDEX idx_homepage_analytics_session_id ON public.homepage_analytics(session_id);
CREATE INDEX idx_homepage_analytics_event_type ON public.homepage_analytics(event_type);
CREATE INDEX idx_homepage_analytics_created_at ON public.homepage_analytics(created_at);

-- Enable RLS but allow public inserts for tracking
ALTER TABLE public.homepage_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public to insert analytics data (anonymous tracking)
CREATE POLICY "Public can insert homepage analytics" 
  ON public.homepage_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Only super admins can view analytics data
CREATE POLICY "Super admins can view homepage analytics" 
  ON public.homepage_analytics 
  FOR SELECT 
  USING (is_super_admin(auth.uid()));

-- Create a view for aggregated homepage analytics
CREATE OR REPLACE VIEW public.homepage_analytics_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view') as unique_visitors,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as sessions,
  COUNT(*) FILTER (WHERE event_type = 'bounce') as bounces,
  AVG(CASE WHEN event_data->>'duration_seconds' IS NOT NULL 
       THEN (event_data->>'duration_seconds')::numeric 
       END) as avg_session_duration,
  jsonb_agg(DISTINCT event_data->>'section_name') FILTER (WHERE event_type = 'section_view') as viewed_sections
FROM public.homepage_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant access to the view for super admins
GRANT SELECT ON public.homepage_analytics_summary TO authenticated;
