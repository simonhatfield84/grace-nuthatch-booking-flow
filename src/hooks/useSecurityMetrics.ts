import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SecurityMetric {
  metric_type: string;
  count: number;
  last_occurrence: string;
}

interface SecurityAnomalyData {
  user_id: string;
  venue_id: string;
  suspicious_activity: string;
  event_count: number;
  last_event: string;
}

export const useSecurityMetrics = () => {
  const securityAlertsQuery = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit')
        .select('event_type, created_at, user_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by event type for metrics
      const metrics = data.reduce((acc: Record<string, SecurityMetric>, audit) => {
        if (!acc[audit.event_type]) {
          acc[audit.event_type] = {
            metric_type: audit.event_type,
            count: 0,
            last_occurrence: audit.created_at
          };
        }
        acc[audit.event_type].count++;
        if (audit.created_at > acc[audit.event_type].last_occurrence) {
          acc[audit.event_type].last_occurrence = audit.created_at;
        }
        return acc;
      }, {});

      return {
        recent_events: data,
        metrics: Object.values(metrics),
        total_events: data.length
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const roleAnomaliesQuery = useQuery({
    queryKey: ['role-anomalies'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_role_anomalies');
      
      if (error) throw error;
      
      return data as SecurityAnomalyData[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const systemHealthQuery = useQuery({
    queryKey: ['security-system-health'],
    queryFn: async () => {
      // Check various security-related system metrics
      const [
        recentFailedLogins,
        suspiciousActivities,
        unusualPatterns
      ] = await Promise.all([
        supabase
          .from('security_audit')
          .select('id')
          .in('event_type', ['login_failed', 'unauthorized_access'])
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('security_audit')
          .select('id')
          .in('event_type', ['unauthorized_role_change_attempt', 'self_elevation_attempt'])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('security_audit')
          .select('user_id')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      ]);

      // Calculate unique users with multiple security events
      const uniqueUsers = new Set(unusualPatterns.data?.map(event => event.user_id) || []);
      const suspiciousUserCount = uniqueUsers.size;

      return {
        failed_logins_last_hour: recentFailedLogins.data?.length || 0,
        suspicious_activities_last_24h: suspiciousActivities.data?.length || 0,
        users_with_security_events: suspiciousUserCount,
        health_score: Math.max(0, 100 - (
          (recentFailedLogins.data?.length || 0) * 2 +
          (suspiciousActivities.data?.length || 0) * 5 +
          suspiciousUserCount * 3
        ))
      };
    },
    refetchInterval: 30000,
  });

  return {
    securityAlerts: securityAlertsQuery.data,
    roleAnomalies: roleAnomaliesQuery.data,
    systemHealth: systemHealthQuery.data,
    isLoading: securityAlertsQuery.isLoading || roleAnomaliesQuery.isLoading || systemHealthQuery.isLoading,
    error: securityAlertsQuery.error || roleAnomaliesQuery.error || systemHealthQuery.error,
    refetch: () => {
      securityAlertsQuery.refetch();
      roleAnomaliesQuery.refetch();
      systemHealthQuery.refetch();
    }
  };
};