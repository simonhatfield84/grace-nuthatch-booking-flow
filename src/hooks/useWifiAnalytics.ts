
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WifiAnalytics {
  total_connections: number;
  unique_devices: number;
  returning_visitors: number;
  signup_conversion_rate: number;
  avg_session_duration: number;
  device_types: Record<string, number>;
  hourly_connections: Array<{
    hour: number;
    connections: number;
  }>;
  recent_connections: Array<{
    id: string;
    device_type: string;
    connected_at: string;
    guest_name?: string;
    signup_completed: boolean;
  }>;
}

export const useWifiAnalytics = (dateRange?: { from: Date; to: Date }) => {
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['wifi-analytics', userVenue, dateRange],
    queryFn: async (): Promise<WifiAnalytics> => {
      if (!userVenue) throw new Error('No venue found');

      const fromDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = dateRange?.to || new Date();

      // Get basic analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('wifi_analytics')
        .select(`
          *,
          guests (name)
        `)
        .eq('venue_id', userVenue)
        .gte('connected_at', fromDate.toISOString())
        .lte('connected_at', toDate.toISOString())
        .order('connected_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Get device stats
      const { data: devices, error: devicesError } = await supabase
        .from('wifi_devices')
        .select('*')
        .eq('venue_id', userVenue)
        .gte('last_seen_at', fromDate.toISOString())
        .lte('last_seen_at', toDate.toISOString());

      if (devicesError) throw devicesError;

      // Process the data
      const totalConnections = analytics?.length || 0;
      const uniqueDevices = new Set(analytics?.map(a => a.device_fingerprint)).size;
      const returningVisitors = devices?.filter(d => d.is_returning).length || 0;
      const signupCompletions = analytics?.filter(a => a.signup_completed).length || 0;
      const signupConversionRate = totalConnections > 0 ? (signupCompletions / totalConnections) * 100 : 0;

      // Calculate average session duration (placeholder - would need session end times)
      const avgSessionDuration = 25; // minutes

      // Device type breakdown
      const deviceTypes: Record<string, number> = {};
      analytics?.forEach(a => {
        const type = a.device_type || 'unknown';
        deviceTypes[type] = (deviceTypes[type] || 0) + 1;
      });

      // Hourly connections
      const hourlyConnections = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        connections: analytics?.filter(a => 
          new Date(a.connected_at).getHours() === hour
        ).length || 0
      }));

      // Recent connections (last 10)
      const recentConnections = (analytics?.slice(0, 10) || []).map(a => ({
        id: a.id,
        device_type: a.device_type || 'unknown',
        connected_at: a.connected_at,
        guest_name: a.guests?.name,
        signup_completed: a.signup_completed
      }));

      return {
        total_connections: totalConnections,
        unique_devices,
        returning_visitors: returningVisitors,
        signup_conversion_rate: Math.round(signupConversionRate * 10) / 10,
        avg_session_duration: avgSessionDuration,
        device_types: deviceTypes,
        hourly_connections,
        recent_connections
      };
    },
    enabled: !!userVenue,
  });
};
