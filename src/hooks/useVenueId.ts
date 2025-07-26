
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVenueId = () => {
  const { user } = useAuth();

  const { data: venueId } = useQuery({
    queryKey: ['venue-id', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();

      if (error || !data) return null;
      return data.venue_id;
    },
    enabled: !!user,
  });

  return venueId;
};
