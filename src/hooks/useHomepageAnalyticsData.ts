
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomepageAnalyticsSummary {
  date: string;
  page_views: number;
  unique_visitors: number;
  sessions: number;
  bounces: number;
  avg_session_duration: number;
  viewed_sections: string[];
}

interface HomepageAnalyticsMetrics {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalSessions: number;
  avgBounceRate: number;
  avgSessionDuration: number;
  popularSections: { section: string; views: number }[];
  dailyData: HomepageAnalyticsSummary[];
}

export const useHomepageAnalyticsData = () => {
  return useQuery({
    queryKey: ['homepage-analytics'],
    queryFn: async (): Promise<HomepageAnalyticsMetrics> => {
      // Get summary data
      const { data: summaryData, error: summaryError } = await supabase
        .from('homepage_analytics_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (summaryError) {
        console.error('Error fetching homepage analytics summary:', summaryError);
        throw summaryError;
      }

      // Get section view data for popular sections
      const { data: sectionData, error: sectionError } = await supabase
        .from('homepage_analytics')
        .select('event_data')
        .eq('event_type', 'section_view')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (sectionError) {
        console.error('Error fetching section data:', sectionError);
        throw sectionError;
      }

      // Process section data
      const sectionCounts: Record<string, number> = {};
      sectionData?.forEach(item => {
        const eventData = item.event_data as Record<string, any>;
        const sectionName = eventData?.section_name;
        if (sectionName && typeof sectionName === 'string') {
          sectionCounts[sectionName] = (sectionCounts[sectionName] || 0) + 1;
        }
      });

      const popularSections = Object.entries(sectionCounts)
        .map(([section, views]) => ({ section, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate totals and transform summary data
      const transformedSummaryData: HomepageAnalyticsSummary[] = (summaryData || []).map(item => ({
        date: item.date || '',
        page_views: Number(item.page_views) || 0,
        unique_visitors: Number(item.unique_visitors) || 0,
        sessions: Number(item.sessions) || 0,
        bounces: Number(item.bounces) || 0,
        avg_session_duration: Number(item.avg_session_duration) || 0,
        viewed_sections: Array.isArray(item.viewed_sections) 
          ? (item.viewed_sections as string[]).filter(Boolean)
          : []
      }));

      const totalPageViews = transformedSummaryData.reduce((sum, day) => sum + day.page_views, 0);
      const totalUniqueVisitors = transformedSummaryData.reduce((sum, day) => sum + day.unique_visitors, 0);
      const totalSessions = transformedSummaryData.reduce((sum, day) => sum + day.sessions, 0);
      const totalBounces = transformedSummaryData.reduce((sum, day) => sum + day.bounces, 0);
      const avgBounceRate = totalSessions > 0 ? (totalBounces / totalSessions) * 100 : 0;
      
      const validDurations = transformedSummaryData.filter(day => day.avg_session_duration > 0);
      const avgSessionDuration = validDurations.length > 0 
        ? validDurations.reduce((sum, day) => sum + day.avg_session_duration, 0) / validDurations.length 
        : 0;

      return {
        totalPageViews,
        totalUniqueVisitors,
        totalSessions,
        avgBounceRate,
        avgSessionDuration,
        popularSections,
        dailyData: transformedSummaryData,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
};
