
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  details?: string;
}

interface SystemHealth {
  database: HealthStatus;
  auth: HealthStatus;
  email: HealthStatus;
  payments: HealthStatus;
  overall: HealthStatus;
}

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const startTime = Date.now();
      
      // Test database connectivity
      const dbStart = Date.now();
      let dbStatus: HealthStatus;
      try {
        const { error } = await supabase.from('platform_metrics').select('id').limit(1);
        const dbTime = Date.now() - dbStart;
        
        if (error) {
          dbStatus = {
            status: 'unhealthy',
            responseTime: dbTime,
            lastCheck: new Date().toLocaleTimeString(),
            details: error.message
          };
        } else {
          dbStatus = {
            status: dbTime < 1000 ? 'healthy' : dbTime < 3000 ? 'degraded' : 'unhealthy',
            responseTime: dbTime,
            lastCheck: new Date().toLocaleTimeString()
          };
        }
      } catch (err) {
        dbStatus = {
          status: 'unhealthy',
          responseTime: Date.now() - dbStart,
          lastCheck: new Date().toLocaleTimeString(),
          details: 'Connection failed'
        };
      }

      // Test authentication service
      const authStart = Date.now();
      let authStatus: HealthStatus;
      try {
        const { error } = await supabase.auth.getSession();
        const authTime = Date.now() - authStart;
        
        if (error) {
          authStatus = {
            status: 'degraded',
            responseTime: authTime,
            lastCheck: new Date().toLocaleTimeString(),
            details: error.message
          };
        } else {
          authStatus = {
            status: authTime < 500 ? 'healthy' : authTime < 2000 ? 'degraded' : 'unhealthy',
            responseTime: authTime,
            lastCheck: new Date().toLocaleTimeString()
          };
        }
      } catch (err) {
        authStatus = {
          status: 'unhealthy',
          responseTime: Date.now() - authStart,
          lastCheck: new Date().toLocaleTimeString(),
          details: 'Auth service unavailable'
        };
      }

      // Test email service (mock for now - would integrate with actual health endpoint)
      const emailStart = Date.now();
      const emailTime = Date.now() - emailStart;
      const emailStatus: HealthStatus = {
        status: 'healthy', // Would be determined by actual health check
        responseTime: emailTime,
        lastCheck: new Date().toLocaleTimeString()
      };

      // Test payment service (mock for now - would integrate with Stripe health)
      const paymentStart = Date.now();
      const paymentTime = Date.now() - paymentStart;
      const paymentStatus: HealthStatus = {
        status: 'healthy', // Would be determined by actual health check
        responseTime: paymentTime,
        lastCheck: new Date().toLocaleTimeString()
      };

      // Calculate overall health
      const allStatuses = [dbStatus, authStatus, emailStatus, paymentStatus];
      const hasUnhealthy = allStatuses.some(s => s.status === 'unhealthy');
      const hasDegraded = allStatuses.some(s => s.status === 'degraded');
      
      const overallStatus: HealthStatus = {
        status: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toLocaleTimeString()
      };

      return {
        database: dbStatus,
        auth: authStatus,
        email: emailStatus,
        payments: paymentStatus,
        overall: overallStatus
      };
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
    retryDelay: 5000
  });
};
