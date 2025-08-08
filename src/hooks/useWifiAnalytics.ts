
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWifiAnalytics = (dateRange?: { from: Date; to: Date }) => {
  // Get current user's session to get venue_id
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Get venue_id from user profile
  const { data: profile } = useQuery({
    queryKey: ['user-venue', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  return useQuery({
    queryKey: ['wifi-analytics', profile?.venue_id, dateRange],
    queryFn: async () => {
      if (!profile?.venue_id) return null;

      const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.to || new Date();

      // Get WiFi analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('wifi_analytics')
        .select(`
          id,
          device_fingerprint,
          device_type,
          device_os,
          device_browser,
          connected_at,
          session_duration_minutes,
          guest_id,
          guests (
            name,
            email,
            wifi_signup_source
          )
        `)
        .eq('venue_id', profile.venue_id)
        .gte('connected_at', startDate.toISOString())
        .lte('connected_at', endDate.toISOString())
        .order('connected_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Get device data
      const { data: devicesData, error: devicesError } = await supabase
        .from('wifi_devices')
        .select('*')
        .eq('venue_id', profile.venue_id)
        .gte('last_seen_at', startDate.toISOString())
        .lte('last_seen_at', endDate.toISOString());

      if (devicesError) throw devicesError;

      // Get active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('wifi_sessions')
        .select('*')
        .eq('venue_id', profile.venue_id)
        .eq('is_active', true);

      if (sessionsError) throw sessionsError;

      // Calculate metrics
      const totalConnections = analyticsData?.length || 0;
      const uniqueDevices = new Set(analyticsData?.map(a => a.device_fingerprint)).size;
      const returningVisitors = devicesData?.filter(d => d.connection_count > 1).length || 0;
      const averageSessionDuration = analyticsData?.reduce((acc, curr) => {
        return acc + (curr.session_duration_minutes || 0);
      }, 0) / totalConnections || 0;

      // Device type breakdown
      const deviceTypes = analyticsData?.reduce((acc, curr) => {
        const type = curr.device_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Daily connection trends
      const dailyConnections = analyticsData?.reduce((acc, curr) => {
        const date = new Date(curr.connected_at).toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Guest conversion (WiFi signup to registered guest)
      const wifiGuests = analyticsData?.filter(a => a.guests?.wifi_signup_source).length || 0;
      const conversionRate = totalConnections > 0 ? (wifiGuests / totalConnections) * 100 : 0;

      return {
        summary: {
          totalConnections,
          uniqueDevices,
          returningVisitors,
          averageSessionDuration: Math.round(averageSessionDuration),
          activeSessions: sessionsData?.length || 0,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        deviceTypes,
        dailyConnections,
        recentConnections: analyticsData?.slice(0, 10) || [],
        activeDevices: devicesData || [],
        activeSessions: sessionsData || []
      };
    },
    enabled: !!profile?.venue_id,
  });
};
