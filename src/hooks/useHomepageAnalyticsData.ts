
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
        const sectionName = item.event_data?.section_name;
        if (sectionName) {
          sectionCounts[sectionName] = (sectionCounts[sectionName] || 0) + 1;
        }
      });

      const popularSections = Object.entries(sectionCounts)
        .map(([section, views]) => ({ section, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate totals
      const totalPageViews = summaryData?.reduce((sum, day) => sum + (day.page_views || 0), 0) || 0;
      const totalUniqueVisitors = summaryData?.reduce((sum, day) => sum + (day.unique_visitors || 0), 0) || 0;
      const totalSessions = summaryData?.reduce((sum, day) => sum + (day.sessions || 0), 0) || 0;
      const totalBounces = summaryData?.reduce((sum, day) => sum + (day.bounces || 0), 0) || 0;
      const avgBounceRate = totalSessions > 0 ? (totalBounces / totalSessions) * 100 : 0;
      
      const validDurations = summaryData?.filter(day => day.avg_session_duration !== null) || [];
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
        dailyData: summaryData || [],
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
};
