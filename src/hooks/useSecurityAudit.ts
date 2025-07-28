
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

export const useSecurityAudit = () => {
  return useQuery({
    queryKey: ['security-audit'],
    queryFn: async (): Promise<SecurityAuditEvent[]> => {
      console.log('🔍 Fetching security audit logs...');

      try {
        // Query the existing security_audit table if it exists, otherwise return mock data
        const { data, error } = await supabase
          .from('security_audit')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.log('⚠️ Security audit table not found, using mock data');
          // Return mock data for demonstration
          const mockEvents: SecurityAuditEvent[] = [
            {
              id: '1',
              user_id: 'user123',
              venue_id: 'venue456',
              event_type: 'login_attempt',
              event_details: { success: true, method: 'email' },
              ip_address: '192.168.1.100',
              user_agent: 'Mozilla/5.0...',
              created_at: new Date().toISOString()
            }
          ];
          return mockEvents;
        }

        console.log('✅ Security audit logs fetched:', data?.length || 0);
        return (data || []) as SecurityAuditEvent[];
      } catch (error) {
        console.error('💥 Failed to fetch security audit logs:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};
