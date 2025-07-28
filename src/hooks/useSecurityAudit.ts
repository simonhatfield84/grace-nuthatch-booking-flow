import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SecurityAuditEvent {
  id: string;
  user_id: string | null;
  venue_id: string | null;
  event_type: string;
  event_details: any;
  ip_address: unknown | null;
  user_agent: string | null;
  created_at: string;
}

export const useSecurityAudit = (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
  return useQuery({
    queryKey: ['security-audit', timeRange],
    queryFn: async (): Promise<SecurityAuditEvent[]> => {
      console.log('🔍 Fetching security audit logs for range:', timeRange);

      // Calculate the start time based on the range
      const now = new Date();
      let startTime: Date;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      try {
        const { data, error } = await supabase
          .from('security_audit')
          .select('*')
          .gte('created_at', startTime.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ Error fetching security audit logs:', error);
          throw new Error(error.message);
        }

        console.log('✅ Security audit logs fetched:', data?.length || 0);
        return (data || []) as SecurityAuditEvent[];
      } catch (error) {
        console.error('💥 Failed to fetch security audit logs:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time monitoring
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};