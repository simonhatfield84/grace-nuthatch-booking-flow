
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export const useSecurityAlerts = () => {
  return useQuery({
    queryKey: ['security-alerts'],
    queryFn: async (): Promise<SecurityAlert[]> => {
      console.log('🚨 Fetching security alerts...');

      try {
        const { data, error } = await supabase
          .from('security_alerts')
          .select('*')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('❌ Error fetching security alerts:', error);
          throw new Error(error.message);
        }

        console.log('✅ Security alerts fetched:', data?.length || 0);
        return (data || []) as SecurityAlert[];
      } catch (error) {
        console.error('💥 Failed to fetch security alerts:', error);
        throw error;
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds for real-time alerts
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};
