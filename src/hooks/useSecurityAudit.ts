
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVenueId } from "@/hooks/useVenueId";

export const useSecurityAudit = () => {
  const venueId = useVenueId();

  return useQuery({
    queryKey: ['security-audit', venueId],
    queryFn: async () => {
      if (!venueId) return [];

      const { data, error } = await supabase
        .from('security_audit')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!venueId,
  });
};
