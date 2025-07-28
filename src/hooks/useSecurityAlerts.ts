
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
        // For now, return mock data since security_alerts table doesn't exist
        // In a real implementation, this would query the actual security_alerts table
        const mockAlerts: SecurityAlert[] = [
          {
            id: '1',
            alert_type: 'suspicious_login',
            severity: 'medium',
            message: 'Multiple failed login attempts detected',
            details: { ip_address: '192.168.1.100', attempts: 3 },
            resolved: false,
            created_at: new Date().toISOString()
          }
        ];

        console.log('✅ Security alerts fetched:', mockAlerts.length);
        return mockAlerts;
      } catch (error) {
        console.error('💥 Failed to fetch security alerts:', error);
        throw error;
      }
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });
};
