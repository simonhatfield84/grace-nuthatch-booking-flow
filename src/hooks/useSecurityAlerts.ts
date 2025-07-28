import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SecurityAlert {
  user_id: string;
  venue_id: string;
  suspicious_activity: string;
  event_count: number;
  last_event: string;
}

export const useSecurityAlerts = (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
  return useQuery({
    queryKey: ['security-alerts', timeRange],
    queryFn: async (): Promise<SecurityAlert[]> => {
      console.log('🔍 Fetching security alerts for range:', timeRange);

      try {
        // Call the detect_role_anomalies function to get suspicious activities
        const { data, error } = await supabase.rpc('detect_role_anomalies');

        if (error) {
          console.error('❌ Error fetching security alerts:', error);
          throw new Error(error.message);
        }

        console.log('✅ Security alerts fetched:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('💥 Failed to fetch security alerts:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time monitoring
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};