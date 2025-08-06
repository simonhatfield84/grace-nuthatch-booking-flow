
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdvancedRateLimiter, detectThreatLevel } from "@/utils/enhancedSecurityUtils";

interface SecurityMetrics {
  failed_logins_24h: number;
  blocked_attempts_24h: number;
  high_threat_events_24h: number;
  role_violations_24h: number;
  unique_threat_actors_24h: number;
}

interface SecurityCheck {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  threatLevel: 'low' | 'medium' | 'high';
}

export const useEnhancedSecurity = () => {
  const { user } = useAuth();

  // Get security metrics from database
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['security-metrics'],
    queryFn: async (): Promise<SecurityMetrics> => {
      const { data, error } = await supabase.rpc('get_security_metrics');
      if (error) throw error;
      
      // Type cast and validate the JSON response
      const metricsData = data as any;
      return {
        failed_logins_24h: Number(metricsData.failed_logins_24h || 0),
        blocked_attempts_24h: Number(metricsData.blocked_attempts_24h || 0),
        high_threat_events_24h: Number(metricsData.high_threat_events_24h || 0),
        role_violations_24h: Number(metricsData.role_violations_24h || 0),
        unique_threat_actors_24h: Number(metricsData.unique_threat_actors_24h || 0),
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get role anomalies
  const { data: roleAnomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ['role-anomalies'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_role_anomalies');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Enhanced rate limiting with threat detection
  const checkRateLimit = async (
    operation: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<SecurityCheck> => {
    const userAgent = navigator.userAgent;
    const referer = document.referrer;
    const identifier = user?.id || 'anonymous';
    
    // Detect threat level
    const threatLevel = detectThreatLevel(userAgent, referer);
    
    // Use client-side rate limiting
    const clientCheck = await AdvancedRateLimiter.checkLimit(
      identifier,
      { windowMs: windowMinutes * 60 * 1000, maxRequests: maxAttempts },
      threatLevel
    );

    // Also check server-side rate limiting
    try {
      const { data: serverAllowed } = await supabase.rpc('check_advanced_rate_limit', {
        identifier,
        operation_type: operation,
        max_attempts: maxAttempts,
        window_minutes: windowMinutes,
        threat_level: threatLevel
      });

      return {
        allowed: clientCheck.allowed && serverAllowed,
        remaining: clientCheck.remaining,
        resetTime: clientCheck.resetTime,
        threatLevel
      };
    } catch (error) {
      console.error('Server rate limit check failed:', error);
      // Fall back to client-side only
      return {
        ...clientCheck,
        threatLevel
      };
    }
  };

  // Log security events
  const logSecurityEvent = async (
    eventType: string,
    details: Record<string, any> = {},
    severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  ) => {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: {
          ...details,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        p_severity: severity
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Check if user has suspicious activity
  const hasSuspiciousActivity = (userId: string): boolean => {
    return roleAnomalies?.some(anomaly => anomaly.user_id === userId) || false;
  };

  // Get threat level for current session
  const getCurrentThreatLevel = (): 'low' | 'medium' | 'high' => {
    if (!metrics) return 'low';
    
    const {
      failed_logins_24h,
      blocked_attempts_24h,
      high_threat_events_24h
    } = metrics;

    // Determine threat level based on recent activity
    if (high_threat_events_24h > 10 || blocked_attempts_24h > 50) {
      return 'high';
    }
    if (failed_logins_24h > 20 || blocked_attempts_24h > 10) {
      return 'medium';
    }
    
    return 'low';
  };

  return {
    // Data
    metrics,
    roleAnomalies,
    
    // Loading states
    isLoading: metricsLoading || anomaliesLoading,
    
    // Functions
    checkRateLimit,
    logSecurityEvent,
    hasSuspiciousActivity,
    getCurrentThreatLevel
  };
};
