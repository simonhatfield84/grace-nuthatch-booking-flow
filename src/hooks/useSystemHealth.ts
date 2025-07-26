
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
}

interface SystemHealthData {
  database: ServiceHealth;
  auth: ServiceHealth;
  email: ServiceHealth;
  payments: ServiceHealth;
}

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealthData> => {
      const startTime = Date.now();
      
      // Test database connectivity
      let databaseHealth: ServiceHealth;
      try {
        const dbStart = Date.now();
        const { error } = await supabase.from('venues').select('id').limit(1);
        const dbTime = Date.now() - dbStart;
        
        databaseHealth = {
          status: error ? 'unhealthy' : (dbTime > 1000 ? 'degraded' : 'healthy'),
          responseTime: dbTime,
          lastCheck: new Date().toISOString()
        };
      } catch (err) {
        databaseHealth = {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString()
        };
      }

      // Test auth service
      let authHealth: ServiceHealth;
      try {
        const authStart = Date.now();
        const { data: { session } } = await supabase.auth.getSession();
        const authTime = Date.now() - authStart;
        
        authHealth = {
          status: authTime > 1000 ? 'degraded' : 'healthy',
          responseTime: authTime,
          lastCheck: new Date().toISOString()
        };
      } catch (err) {
        authHealth = {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString()
        };
      }

      // Email service health (mock for now)
      const emailHealth: ServiceHealth = {
        status: 'healthy',
        responseTime: 50,
        lastCheck: new Date().toISOString()
      };

      // Payment service health (mock for now)
      const paymentsHealth: ServiceHealth = {
        status: 'healthy',
        responseTime: 75,
        lastCheck: new Date().toISOString()
      };

      return {
        database: databaseHealth,
        auth: authHealth,
        email: emailHealth,
        payments: paymentsHealth
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
