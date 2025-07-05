
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformVenues = () => {
  return useQuery({
    queryKey: ['platform-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          profiles!profiles_venue_id_fkey (
            email,
            first_name,
            last_name,
            role,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdateVenueStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ venueId, status }: { venueId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('venues')
        .update({
          approval_status: status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', venueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-venues'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
    },
  });
};
