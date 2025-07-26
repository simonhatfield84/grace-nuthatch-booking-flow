
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVenueId } from "@/hooks/useVenueId";

export const useSecurityAlerts = () => {
  const venueId = useVenueId();

  return useQuery({
    queryKey: ['security-alerts', venueId],
    queryFn: async () => {
      if (!venueId) return [];

      // For now, return empty array since there's no specific security_alerts table
      // This could be extended to query security_audit for alert-worthy events
      const { data, error } = await supabase
        .from('security_audit')
        .select('*')
        .eq('venue_id', venueId)
        .in('event_type', ['unauthorized_role_change_attempt', 'self_elevation_attempt', 'owner_demotion_attempt_blocked'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!venueId,
  });
};
