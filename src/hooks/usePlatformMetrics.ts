
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformMetrics = () => {
  return useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      // Get venue counts
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('approval_status');

      if (venuesError) throw venuesError;

      // Get user count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Get booking count
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id');

      if (bookingsError) throw bookingsError;

      // Get security events count for last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: securityEvents, error: securityError } = await supabase
        .from('security_audit')
        .select('id, event_type, created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (securityError) console.warn('Security events query failed:', securityError);

      // Test system health with basic connectivity
      const healthStart = Date.now();
      let systemHealth = 'operational';
      try {
        const { error: healthError } = await supabase
          .from('platform_metrics')
          .select('id')
          .limit(1);
        
        const responseTime = Date.now() - healthStart;
        if (healthError || responseTime > 3000) {
          systemHealth = 'degraded';
        }
      } catch (err) {
        systemHealth = 'down';
      }

      const totalVenues = venues?.length || 0;
      const activeVenues = venues?.filter(v => v.approval_status === 'approved').length || 0;
      const pendingVenues = venues?.filter(v => v.approval_status === 'pending').length || 0;
      const totalUsers = profiles?.length || 0;
      const totalBookings = bookings?.length || 0;
      const totalSecurityEvents = securityEvents?.length || 0;
      const criticalSecurityEvents = securityEvents?.filter(e => 
        ['permission_denied', 'login_failure', 'rate_limit_exceeded'].includes(e.event_type)
      ).length || 0;

      return {
        totalVenues,
        activeVenues,
        pendingVenues,
        totalUsers,
        totalBookings,
        totalSecurityEvents,
        criticalSecurityEvents,
        systemHealth,
        lastUpdated: new Date().toISOString()
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
